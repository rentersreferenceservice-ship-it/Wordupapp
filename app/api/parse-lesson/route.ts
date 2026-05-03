import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import type { Hunk } from '@/lib/types'
import { getSupabase } from '@/lib/supabase'

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

type RawElement =
  | { type: 'text'; text: string; color: string | null }
  | { type: 'image'; rId: string }

function extractDocxElements(xml: string): RawElement[] {
  const result: RawElement[] = []
  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g
  let paraMatch

  while ((paraMatch = paraRegex.exec(xml)) !== null) {
    const para = paraMatch[0]

    // Paragraph contains an embedded image — grab the relationship id
    if (para.includes('<w:drawing')) {
      // r:embed is the standard attribute; accept any rId value (not just rId\d+)
      const rIdMatch = para.match(/r:embed="([^"]+)"/)
      if (rIdMatch) {
        result.push({ type: 'image', rId: rIdMatch[1] })
        continue
      }
    }

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

    result.push({ type: 'text', text, color })
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
  const path = `${uuidv4()}.${ext}`
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

function formatElementsForClaude(elements: RawElement[]): string {
  return elements.map(el => {
    if (el.type === 'image') return null // images handled separately
    if (el.color && el.color !== '000000' && el.color !== 'auto') {
      return `[color:#${el.color}] ${el.text}`
    }
    return el.text
  }).filter(Boolean).join('\n')
}

// Build a map from the first 30 chars of a text paragraph → the image index that immediately precedes it
function buildTextToImageMap(elements: RawElement[], rIdToIndex: Map<string, number>): Map<string, number> {
  const map = new Map<string, number>()
  let pendingIdx: number | null = null
  for (const el of elements) {
    if (el.type === 'image') {
      pendingIdx = rIdToIndex.get(el.rId) ?? null
    } else if (el.type === 'text' && pendingIdx !== null) {
      const key = el.text.substring(0, 30).toLowerCase().replace(/\s+/g, ' ').trim()
      map.set(key, pendingIdx)
      pendingIdx = null
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

    // DOCX: extract paragraphs with color annotations + embedded image markers
    const zip = await JSZip.loadAsync(buffer)
    const xmlFile = zip.file('word/document.xml')
    if (!xmlFile) return NextResponse.json({ error: 'Invalid DOCX file' }, { status: 400 })

    const xml = await xmlFile.async('string')
    const elements = extractDocxElements(xml)

    // Build rId → imageIndex map and upload images to Supabase Storage
    const rIdToIndex = new Map<string, number>()
    const imageUrls: (string | null)[] = []

    const relsFile = zip.file('word/_rels/document.xml.rels')
    if (relsFile) {
      const relsXml = await relsFile.async('string')
      const relMap = parseRelationships(relsXml)

      const imageElements = elements.filter(el => el.type === 'image')
      console.log(`parse-lesson: found ${imageElements.length} image element(s) in DOCX`)
      console.log(`parse-lesson: relationship map has ${relMap.size} image relationship(s):`, [...relMap.entries()])

      for (const el of elements) {
        if (el.type !== 'image') continue
        if (rIdToIndex.has(el.rId)) continue // skip duplicate references to same image

        const idx = rIdToIndex.size
        rIdToIndex.set(el.rId, idx)

        const target = relMap.get(el.rId) // e.g. "media/image1.png"
        if (!target) {
          console.warn(`parse-lesson: no relationship found for rId "${el.rId}"`)
          imageUrls.push(null)
          continue
        }

        const imagePath = `word/${target}`
        const imageFile = zip.file(imagePath)
        if (!imageFile) {
          console.warn(`parse-lesson: image file not found in ZIP at "${imagePath}"`)
          imageUrls.push(null)
          continue
        }

        const imgBuffer = Buffer.from(await imageFile.async('arraybuffer'))
        const filename = target.split('/').pop() || 'image.png'
        console.log(`parse-lesson: uploading image "${filename}" (${imgBuffer.length} bytes)`)
        const url = await uploadImage(imgBuffer, filename)
        console.log(`parse-lesson: upload result for "${filename}":`, url ?? 'FAILED')
        imageUrls.push(url)
      }
    }

    // Map: first 30 chars of hunk body text → image index that precedes it in the document
    const textToImageMap = buildTextToImageMap(elements, rIdToIndex)

    const annotatedText = formatElementsForClaude(elements)

    const result = await askClaude([
      {
        type: 'text',
        text: `Parse this S2C lesson. Lines prefixed with [color:#XXXXXX] are colored questions. All other lines are body text or answers.\n\n${annotatedText}`,
      },
    ])

    // Assign images to hunks by matching hunk body text to the paragraph that follows each image in the document
    const hunks = result.hunks.map(hunk => {
      const key = hunk.text.substring(0, 30).toLowerCase().replace(/\s+/g, ' ').trim()
      const imgIdx = textToImageMap.get(key)
      if (imgIdx !== undefined && imageUrls[imgIdx]) {
        return { ...hunk, imageUrl: imageUrls[imgIdx] as string }
      }
      return hunk
    })

    console.log(`parse-lesson: ${imageUrls.length} image(s) uploaded, textToImageMap keys:`, [...textToImageMap.keys()])

    return NextResponse.json({ title: result.title, hunks, citations: result.citations })
  } catch (e: unknown) {
    console.error('parse-lesson error:', e)
    const msg = e instanceof Error ? e.message : 'Failed to parse lesson'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
