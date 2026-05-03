import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import Anthropic from '@anthropic-ai/sdk'
import type { Hunk } from '@/lib/types'

const CLASSIFY_PROMPT = `You are parsing an S2C (Spelling to Communicate) lesson following the Word Up 2025 SOP.
Return ONLY valid JSON — no markdown, no explanation.

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

TYPE DEFINITIONS — classify each question using these rules in order:

1. VAKT: The line is a movement or sensory instruction, not a question (e.g. "Do 10 jumping jacks", "Take a deep breath", "Stand up and stretch"). Always an action directive.
2. MATH: The answer is a number, count, or calculation.
3. SEMI-OPEN: The answer contains a slash / separating multiple valid responses (e.g. INTELLIGENCE / MOTIVATION / UNDERSTANDING). A slash anywhere in the answer = SEMI-OPEN, no exceptions.
4. KNOWN: Single word or phrase answer taken directly from the passage. No slash. Only one correct answer possible.
5. PRIOR KNOWLEDGE: Requires world knowledge or personal experience not found in the passage.
6. OPEN: Personal reflection, opinion, or creative response with no single correct answer.

Color hints from Word documents (supporting evidence only):
green=KNOWN, orange=SEMI-OPEN, purple=MATH, blue=PRIOR KNOWLEDGE, pink=OPEN, red=VAKT

Uncolored text before the questions = hunk body text. Uncolored text right after a question = its answer.
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
