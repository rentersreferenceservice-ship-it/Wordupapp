import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import Anthropic from '@anthropic-ai/sdk'
import type { Hunk } from '@/lib/types'

const CLASSIFY_PROMPT = `You are parsing an S2C (Spelling to Communicate) lesson document.
Extract the complete lesson structure and return ONLY valid JSON — no markdown, no explanation.

JSON format:
{
  "title": "string",
  "hunks": [
    {
      "number": 1,
      "text": "passage body text",
      "questions": [
        { "type": "KNOWN", "question": "question text", "answer": "answer text or empty string" }
      ]
    }
  ],
  "citations": ["citation 1", "citation 2"]
}

Question type rules — classify each question as exactly one of:
- KNOWN (green): the answer comes directly from the passage text and there is only ONE correct answer
- SEMI-OPEN (orange): the answer relates to the passage but MULTIPLE answers are possible, or requires inference/prediction
- PRIOR KNOWLEDGE (blue): asks the student to draw on background knowledge or personal experience outside the text
- MATH (purple): involves numbers, counting, or calculation
- VAKT (red): a sensory or movement break activity (e.g. "Take a movement break", "Do 10 jumping jacks")
- OPEN (pink): a purely open-ended opinion or personal response with no single correct answer

Key distinction:
- KNOWN = exactly ONE correct answer from the text. The answer field never contains a slash (/). If you see a slash in the answer, it is NOT KNOWN.
- SEMI-OPEN = the answer contains a slash (e.g. INTELLIGENCE / MOTIVATION / UNDERSTANDING) meaning multiple responses are valid, OR the student must infer/predict. Any answer with a slash is automatically SEMI-OPEN.

For Word documents, colored text lines are questions. Use the color as a supporting hint:
green → KNOWN, orange → SEMI-OPEN, blue → PRIOR KNOWLEDGE, purple → MATH, red → VAKT, pink → OPEN.
When color and question wording disagree, trust the wording.
Uncolored text before questions = hunk body text. Uncolored text immediately after a question = its answer.

If answers are present, include them. If not, use empty string.
Strip numbering from citations (e.g. "1. Smith..." → "Smith...").`

interface RawParagraph {
  text: string
  color: string | null
}

function extractDocxParagraphs(xml: string): RawParagraph[] {
  const result: RawParagraph[] = []
  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g
  let paraMatch

  while ((paraMatch = paraRegex.exec(xml)) !== null) {
    const para = paraMatch[0]

    const texts: string[] = []
    const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g
    let tMatch
    while ((tMatch = tRegex.exec(para)) !== null) {
      texts.push(tMatch[1])
    }
    const text = texts
      .join('')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()

    if (!text) continue

    const colorMatch = para.match(/<w:color w:val="([0-9a-fA-F]{6})"/)
    const color = colorMatch ? colorMatch[1].toLowerCase() : null

    result.push({ text, color })
  }

  return result
}

function formatDocxForClaude(paras: RawParagraph[]): string {
  return paras.map(p => {
    if (p.color && p.color !== '000000' && p.color !== 'auto') {
      return `[color:#${p.color}] ${p.text}`
    }
    return p.text
  }).join('\n')
}

async function askClaude(userContent: Parameters<Anthropic['messages']['create']>[0]['messages'][0]['content']): Promise<{ title: string; hunks: Hunk[]; citations: string[] }> {
  const client = new Anthropic()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: CLASSIFY_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response from Claude')

  const raw = content.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const json = JSON.parse(raw)
  return {
    title: json.title ?? '',
    hunks: (json.hunks ?? []).map((h: Hunk, i: number) => ({ ...h, number: i + 1 })),
    citations: json.citations ?? [],
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const isPdf = file.name.toLowerCase().endsWith('.pdf')

    if (isPdf) {
      const base64 = buffer.toString('base64')
      const result = await askClaude([
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as never,
        { type: 'text', text: 'Parse this S2C lesson document per the instructions.' },
      ])
      return NextResponse.json(result)
    }

    // DOCX: extract paragraphs with color annotations, send text to Claude
    const zip = await JSZip.loadAsync(buffer)
    const xmlFile = zip.file('word/document.xml')
    if (!xmlFile) return NextResponse.json({ error: 'Invalid DOCX file' }, { status: 400 })

    const xml = await xmlFile.async('string')
    const paras = extractDocxParagraphs(xml)
    const annotatedText = formatDocxForClaude(paras)

    const result = await askClaude([
      { type: 'text', text: `Parse this S2C lesson. Lines prefixed with [color:#XXXXXX] are colored text (questions). All other lines are body text or answers.\n\n${annotatedText}` },
    ])
    return NextResponse.json(result)
  } catch (e: unknown) {
    console.error('parse-lesson error:', e)
    const msg = e instanceof Error ? e.message : 'Failed to parse lesson'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
