import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import type { Hunk } from '@/lib/types'
import { getSupabase } from '@/lib/supabase'

export const maxDuration = 60

const CLASSIFY_PROMPT = `You are parsing an S2C (Spelling to Communicate) lesson following the Word Up 2025 SOP.
Return ONLY valid JSON — no markdown, no explanation.

JSON format:
{
  "title": "string",
  "author": "string or empty string",
  "hunks": [
    {
      "number": 1,
      "text": "passage body text",
      "imageIndex": 0,
      "questions": [
        { "type": "KNOWN", "question": "question text", "answer": "answer text or empty string" }
      ]
    }
  ],
  "citations": ["citation 1", "citation 2"]
}

imageIndex: If a hunk's body text is immediately preceded by an [IMAGE:N] marker in the input, set "imageIndex" to N (the integer). Omit "imageIndex" entirely if no image precedes that hunk.

For author: look for a line like "By [Name]", "Written by [Name]", or a standalone author name near the title. If not found, return an empty string.

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

For VAKT questions: also add a "youtubeQuery" field — a 2-4 word YouTube search term for a short video relevant to the movement or sensory activity (e.g. "jumping jacks exercise", "deep breathing kids", "yoga stretch children"). Also add a "youtubeDescription" field: one short sentence under 10 words describing what students will watch (e.g. "Watch a guided stretching exercise").

For citations: Find every entry in any section headed References, Sources, Bibliography, Works Cited, or similar. Include ALL entries — do not omit any. Strip only the leading number or bullet (e.g. "1. Smith..." → "Smith..."). If no references section exists, return an empty array.`

interface RawParagraph {
  pos: number
  text: string
  color: string | null
}

// Extract text paragraphs with their XML character position
function extractTextParagraphs(xml: string): RawParagraph[] {
  const result: RawParagraph[] = []
  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g
  let m
  while ((m = paraRegex.exec(xml)) !== null) {
    const para = m[0]
    const texts: string[] = []
    const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g
    let tMatch
    while ((tMatch = tRegex.exec(para)) !== null) {
      texts.push(tMatch[1])
    }
    const text = texts.join('')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
    if (!text) continue
    const colorMatch = para.match(/<w:color w:val="([0-9a-fA-F]{6})"/)
    result.push({ pos: m.index, text, color: colorMatch ? colorMatch[1].toLowerCase() : null })
  }
  return result
}

// Find all image embed references in the XML with their character positions
function extractImageEmbeds(xml: string): Array<{ pos: number; rId: string }> {
  const result: Array<{ pos: number; rId: string }> = []
  const seen = new Set<string>()
  // Match r:embed and r:id (VML format) - covers DrawingML and legacy picture elements
  const pattern = /r:(?:embed|id)="([^"]+)"/g
  let m
  while ((m = pattern.exec(xml)) !== null) {
    const rId = m[1]
    if (!seen.has(rId)) {
      seen.add(rId)
      result.push({ pos: m.index, rId })
    }
  }
  return result
}

function parseRelationships(relsXml: string): Map<string, string> {
  const map = new Map<string, string>()
  // Parse each <Relationship .../> element independently — attribute order varies by generator
  const relRegex = /<Relationship\s[^>]+>/g
  let match
  while ((match = relRegex.exec(relsXml)) !== null) {
    const el = match[0]
    const idMatch = el.match(/\bId="([^"]+)"/)
    const targetMatch = el.match(/\bTarget="([^"]+)"/)
    const typeMatch = el.match(/\bType="([^"]+)"/)
    if (idMatch && targetMatch && typeMatch && typeMatch[1].includes('/image')) {
      map.set(idMatch[1], targetMatch[1])
    }
  }
  return map
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'png': return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    default: return 'image/png'
  }
}

async function uploadImage(buffer: Buffer, originalFilename: string): Promise<string | null> {
  const supabase = getSupabase()
  const ext = originalFilename.split('.').pop() || 'png'
  const path = `${randomUUID()}.${ext}`
  const mimeType = getMimeType(originalFilename)

  const { error } = await supabase.storage.from('lesson-images').upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) {
    console.error('Image upload failed:', error.message)
    return null
  }

  const { data } = supabase.storage.from('lesson-images').getPublicUrl(path)
  return data.publicUrl
}

function formatParagraphsForClaude(
  paras: RawParagraph[],
  embeds: Array<{ pos: number; rId: string }>,
  rIdToUrl: Map<string, string>
): { annotatedText: string; imageUrls: string[] } {
  // Build ordered list of image URLs (only those that uploaded successfully)
  const imageUrls: string[] = []
  // Map: paragraph pos → image index to inject before it
  const posToImageIndex = new Map<number, number>()

  for (const embed of embeds) {
    const url = rIdToUrl.get(embed.rId)
    if (!url) continue
    const idx = imageUrls.length
    imageUrls.push(url)
    // Find the first text paragraph AFTER this embed position
    const nextPara = paras.find(p => p.pos > embed.pos)
    if (nextPara) {
      posToImageIndex.set(nextPara.pos, idx)
      console.log(`parse-lesson: [IMAGE:${idx}] will appear before para at pos ${nextPara.pos}`)
    }
  }

  const lines: string[] = []
  for (const p of paras) {
    const imgIdx = posToImageIndex.get(p.pos)
    if (imgIdx !== undefined) {
      lines.push(`[IMAGE:${imgIdx}]`)
    }
    if (p.color && p.color !== '000000' && p.color !== 'auto') {
      lines.push(`[color:#${p.color}] ${p.text}`)
    } else {
      lines.push(p.text)
    }
  }

  return { annotatedText: lines.join('\n'), imageUrls }
}

type HunkWithIndex = Hunk & { imageIndex?: number }

async function askClaude(
  userContent: Parameters<Anthropic['messages']['create']>[0]['messages'][0]['content']
): Promise<{ title: string; author: string; hunks: HunkWithIndex[]; citations: string[] }> {
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
    author: json.author ?? '',
    hunks: (json.hunks ?? []).map((h: HunkWithIndex, i: number) => ({ ...h, number: i + 1 })),
    citations: json.citations ?? [],
  }
}

export async function GET() {
  return Response.json({ ok: true, message: 'parse-lesson route is reachable' })
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      fileName: string
      isPdf: boolean
      fileData?: string
      xmlContent?: string
      images?: Array<{ rId: string; fileName: string; base64Data: string }>
    }
    const { fileName, isPdf, fileData, xmlContent, images } = body
    if (!fileName) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (isPdf && fileData) {
      const result = await askClaude([
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } } as never,
        { type: 'text', text: 'Parse this S2C lesson document per the instructions.' },
      ])
      return NextResponse.json(result)
    }

    if (!xmlContent) return NextResponse.json({ error: 'No document content received' }, { status: 400 })

    // Upload images and build rId → URL map
    const rIdToUrl = new Map<string, string>()
    if (Array.isArray(images)) {
      for (const img of images) {
        const buf = Buffer.from(img.base64Data, 'base64')
        const url = await uploadImage(buf, img.fileName)
        if (url) rIdToUrl.set(img.rId, url)
      }
    }

    // Parse XML and build annotated text with [IMAGE:N] markers
    const paras = extractTextParagraphs(xmlContent)
    const embeds = extractImageEmbeds(xmlContent)
    const { annotatedText, imageUrls } = formatParagraphsForClaude(paras, embeds, rIdToUrl)

    const result = await askClaude([
      {
        type: 'text',
        text: `Parse this S2C lesson. Lines prefixed with [color:#XXXXXX] are colored questions. Lines that say [IMAGE:N] indicate an image immediately precedes the next hunk — include "imageIndex": N in that hunk. All other lines are body text or answers.\n\n${annotatedText}`,
      },
    ])

    const hunks = result.hunks.map(hunk => {
      const { imageIndex, ...rest } = hunk
      const url = imageIndex !== undefined ? imageUrls[imageIndex] : undefined
      return url ? { ...rest, imageUrl: url } : rest
    })

    return NextResponse.json({ title: result.title, author: result.author, hunks, citations: result.citations })
  } catch (e: unknown) {
    console.error('parse-lesson error:', e)
    const msg = e instanceof Error ? e.message : 'Failed to parse lesson'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
