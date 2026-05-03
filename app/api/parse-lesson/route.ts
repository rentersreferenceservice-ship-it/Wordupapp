import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import Anthropic from '@anthropic-ai/sdk'
import type { Hunk, Question, QuestionType } from '@/lib/types'

const COLOR_TO_TYPE: Record<string, QuestionType> = {
  '15803d': 'KNOWN',
  'f97316': 'SEMI-OPEN',
  '2563eb': 'PRIOR KNOWLEDGE',
  '7e22ce': 'MATH',
  'dc2626': 'VAKT',
  'db2777': 'OPEN',
}

interface ParsedParagraph {
  text: string
  questionType: QuestionType | null
}

function parseDocxXml(xml: string): ParsedParagraph[] {
  const result: ParsedParagraph[] = []
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

    let questionType: QuestionType | null = null
    const colorRegex = /<w:color w:val="([0-9a-fA-F]{6})"/g
    let colorMatch
    while ((colorMatch = colorRegex.exec(para)) !== null) {
      const t = COLOR_TO_TYPE[colorMatch[1].toLowerCase()]
      if (t) { questionType = t; break }
    }

    result.push({ text, questionType })
  }

  return result
}

function buildLesson(paras: ParsedParagraph[]): { title: string; hunks: Hunk[]; citations: string[] } {
  let title = ''
  const hunks: Hunk[] = []
  const citations: string[] = []
  let inRefs = false
  let hunkText = ''
  let questions: Question[] = []
  let lastWasQuestion = false

  function flushHunk() {
    if (hunkText || questions.length > 0) {
      hunks.push({
        number: hunks.length + 1,
        text: hunkText.trim(),
        questions: [...questions],
      })
      hunkText = ''
      questions = []
      lastWasQuestion = false
    }
  }

  for (const { text, questionType } of paras) {
    if (!title && !questionType) {
      title = text
      continue
    }

    if (/^references?(\s*:)?$/i.test(text.trim())) {
      flushHunk()
      inRefs = true
      continue
    }

    if (inRefs) {
      citations.push(text.replace(/^\d+\.\s*/, ''))
      continue
    }

    if (questionType) {
      questions.push({ type: questionType, question: text, answer: '' })
      lastWasQuestion = true
    } else if (lastWasQuestion && questions.length > 0 && !questions[questions.length - 1].answer) {
      questions[questions.length - 1].answer = text
      lastWasQuestion = false
    } else {
      if (questions.length > 0) flushHunk()
      hunkText = hunkText ? hunkText + ' ' + text : text
      lastWasQuestion = false
    }
  }

  flushHunk()
  return { title, hunks, citations }
}

const PDF_PROMPT = `You are parsing an S2C (Spelling to Communicate) lesson document.
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
- KNOWN: tests recall of a vocabulary word or fact the student already knows
- SEMI-OPEN: requires prediction, inference, or filling in a blank
- PRIOR KNOWLEDGE: asks about background knowledge or personal experience
- MATH: involves numbers, counting, or calculation
- VAKT: a sensory or movement break activity (e.g. "Take a movement break", "Do 10 jumping jacks")
- OPEN: open-ended opinion or personal response question

If answers are present in the document, include them. If not, use empty string.
Strip any numbering from citations (e.g. "1. Smith..." → "Smith...").`

async function parsePdf(buffer: Buffer): Promise<{ title: string; hunks: Hunk[]; citations: string[] }> {
  const client = new Anthropic()
  const base64 = buffer.toString('base64')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          { type: 'text', text: PDF_PROMPT },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response from Claude')

  // Strip markdown code fences if Claude wraps the JSON
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
      const result = await parsePdf(buffer)
      return NextResponse.json(result)
    }

    const zip = await JSZip.loadAsync(buffer)
    const xmlFile = zip.file('word/document.xml')
    if (!xmlFile) return NextResponse.json({ error: 'Invalid DOCX file' }, { status: 400 })

    const xml = await xmlFile.async('string')
    const paras = parseDocxXml(xml)
    const { title, hunks, citations } = buildLesson(paras)

    return NextResponse.json({ title, hunks, citations })
  } catch (e: unknown) {
    console.error('parse-lesson error:', e)
    const msg = e instanceof Error ? e.message : 'Failed to parse lesson'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
