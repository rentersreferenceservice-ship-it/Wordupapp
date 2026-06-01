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

function formatParagraphsForClaude(paras: RawParagraph[]): string {
  return paras.map(p => {
    if (p.color && p.color !== '000000' && p.color !== 'auto') {
      return `[color:#${p.color}] ${p.text}`
    }
    return p.text
  }).join('\n')
}

// Build map: first 30 chars of a text paragraph → the image URL that immediately precedes it in the XML
function buildTextToImageUrlMap(
  embeds: Array<{ pos: number; rId: string }>,
  paras: RawParagraph[],
  rIdToUrl: Map<string, string>
): Map<string, string> {
  const map = new Map<string, string>()
  for (const embed of embeds) {
    const url = rIdToUrl.get(embed.rId)
    if (!url) continue
    // Find the first text paragraph that appears AFTER this image in the XML
    const nextPara = paras.find(p => p.pos > embed.pos)
    if (nextPara) {
      const key = nextPara.text.substring(0, 30).toLowerCase().replace(/\s+/g, ' ').trim()
      map.set(key, url)
      console.log(`parse-lesson: image mapped to paragraph starting "${key.substring(0, 20)}…"`)
    }
  }
  return map
}

async function askClaude(
  userContent: Parameters<Anthropic['messages']['create']>[0]['messages'][0]['content']
): Promise<{ title: string; hunks: Hunk[]; citations: string[] }> {
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

export async function GET() {
  return Response.json({ ok: true, message: 'parse-lesson route is reachable' })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const base64 = buffer.toString('base64')
      const result = await askClaude([
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as never,
        { type: 'text', text: 'Parse this S2C lesson document per the instructions.' },
      ])
      return NextResponse.json(result)
    }

    // DOCX: parse XML directly for both text paragraphs and image embed positions
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)

    // Log ZIP contents to diagnose path issues
    const zipEntries = Object.keys(zip.files)
    const mediaEntries = zipEntries.filter(f => f.toLowerCase().includes('media'))
    const relsEntries = zipEntries.filter(f => f.toLowerCase().includes('_rels'))
    console.log(`parse-lesson: ZIP media files:`, mediaEntries)
    console.log(`parse-lesson: ZIP rels files:`, relsEntries)

    const xmlFile = zip.file('word/document.xml')
    if (!xmlFile) return NextResponse.json({ error: 'Invalid DOCX file' }, { status: 400 })

    const xml = await xmlFile.async('string')
    const paras = extractTextParagraphs(xml)
    const embeds = extractImageEmbeds(xml)

    console.log(`parse-lesson: ${paras.length} text paragraphs, ${embeds.length} unique image embed(s):`, embeds.map(e => e.rId))

    // Upload images and build rId → URL map
    const rIdToUrl = new Map<string, string>()

    // Find the rels file by searching ZIP entries (path varies by Word version)
    const relsPath = zipEntries.find(f => f.toLowerCase().endsWith('word/_rels/document.xml.rels') || f.toLowerCase() === 'word/_rels/document.xml.rels')
    const relsFile = relsPath ? zip.file(relsPath) : zip.file('word/_rels/document.xml.rels')
    console.log(`parse-lesson: rels file found at: ${relsPath ?? 'word/_rels/document.xml.rels (hardcoded)'}`, relsFile ? 'EXISTS' : 'NULL')

    if (relsFile) {
      const relsXml = await relsFile.async('string')
      const relMap = parseRelationships(relsXml)
      console.log(`parse-lesson: image relationships:`, [...relMap.entries()])

      for (const { rId } of embeds) {
        const target = relMap.get(rId)
        if (!target) { console.log(`parse-lesson: rId "${rId}" not an image relationship — skipping`); continue }

        // Find the media file in the ZIP (search by filename to handle path variations)
        const filename = target.split('/').pop() || 'image.png'
        const mediaPath = mediaEntries.find(f => f.endsWith(filename)) ?? `word/${target}`
        const imageFile = zip.file(mediaPath)
        console.log(`parse-lesson: looking for "${filename}" at "${mediaPath}":`, imageFile ? 'FOUND' : 'MISSING')
        if (!imageFile) continue

        const imgBuffer = Buffer.from(await imageFile.async('arraybuffer'))
        console.log(`parse-lesson: uploading "${filename}" (${imgBuffer.length} bytes)`)
        const url = await uploadImage(imgBuffer, filename)
        console.log(`parse-lesson: upload → ${url ?? 'FAILED'}`)
        if (url) rIdToUrl.set(rId, url)
      }
    }

    // Map hunk body text (first 30 chars) → the image URL that precedes it in the XML
    const textToImageUrl = buildTextToImageUrlMap(embeds, paras, rIdToUrl)
    console.log(`parse-lesson: textToImageUrl has ${textToImageUrl.size} mapping(s)`)

    const annotatedText = formatParagraphsForClaude(paras)

    const result = await askClaude([
      {
        type: 'text',
        text: `Parse this S2C lesson. Lines prefixed with [color:#XXXXXX] are colored questions. All other lines are body text or answers.\n\n${annotatedText}`,
      },
    ])

    // Match each hunk's body text to the image that preceded it in the document
    const hunks = result.hunks.map(hunk => {
      const key = hunk.text.substring(0, 30).toLowerCase().replace(/\s+/g, ' ').trim()
      const url = textToImageUrl.get(key)
      return url ? { ...hunk, imageUrl: url } : hunk
    })

    return NextResponse.json({ title: result.title, hunks, citations: result.citations })
  } catch (e: unknown) {
    console.error('parse-lesson error:', e)
    const msg = e instanceof Error ? e.message : 'Failed to parse lesson'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
