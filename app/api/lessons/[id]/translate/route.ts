import { NextRequest } from 'next/server'
import { getLesson } from '@/lib/lessonStore'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { language } = await req.json()
  if (!language) return Response.json({ error: 'Language is required' }, { status: 400 })

  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  // Only send text content to translate — preserve images, youtube data, citations
  const contentToTranslate = {
    title: lesson.title,
    hunks: lesson.hunks.map(h => ({
      number: h.number,
      text: h.text,
      questions: h.questions.map(q => ({
        question: q.question,
        answer: q.answer,
      })),
      writingPrompt: h.writingPrompt ?? null,
    })),
    hashtags: lesson.hashtags,
  }

  const client = new Anthropic()

  const prompt = `Translate this S2C (Spelling to Communicate) educational lesson from English to ${language}.

Rules:
- Translate all text naturally — not word-for-word literal. Sound fluent and natural in ${language}.
- Maintain the same warm, conversational tone and the same age-appropriate reading level.
- Keep ALL CAPS answers in ALL CAPS (translate the words but keep them uppercase).
- Preserve fill-in-the-blank blanks — the blank indicator should remain in the same position in the question.
- Translate hashtags to be natural for ${language} speakers (same topics, localized phrasing).
- CRITICAL: All string values must use \\n for newlines — never put a literal newline inside a JSON string value.
- Return ONLY the JSON object with exactly the same structure as the input. Nothing else.

Input:
${JSON.stringify(contentToTranslate, null, 2)}`

  function tryParseTranslation(text: string): typeof contentToTranslate | null {
    let raw = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    // First attempt: parse as-is
    try { return JSON.parse(jsonMatch[0]) } catch {}
    // Second attempt: escape stray control chars inside string tokens, remove trailing commas
    try {
      const cleaned = jsonMatch[0]
        .replace(/"(?:[^"\\]|\\.)*"/g, (token) =>
          token.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
        )
        .replace(/,(\s*[}\]])/g, '$1')
      return JSON.parse(cleaned)
    } catch {}
    return null
  }

  let translated: typeof contentToTranslate | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: 'You are a professional translator. You output ONLY valid JSON — no markdown, no explanation, no code fences. All string values in your JSON must use \\n for line breaks (never literal newlines inside strings). Your entire response must be a single JSON object that can be passed directly to JSON.parse().',
      messages: [{ role: 'user', content: prompt }],
    })
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    translated = tryParseTranslation(responseText)
    if (translated) break
    console.error(`[translate] Attempt ${attempt} failed to parse. Start:`, responseText.slice(0, 300))
  }

  if (!translated) {
    return Response.json({ error: 'Translation failed after 3 attempts — please try again' }, { status: 500 })
  }

  // Merge translated text back into the original lesson structure
  // (preserves imageUrl, imageAlt, youtubeQuery, youtubeVideoId, etc.)
  const translatedLesson = {
    ...lesson,
    title: translated.title ?? lesson.title,
    hashtags: translated.hashtags ?? lesson.hashtags,
    hunks: lesson.hunks.map((origHunk, hi) => {
      const transHunk = translated.hunks?.[hi]
      if (!transHunk) return origHunk
      return {
        ...origHunk,
        text: transHunk.text ?? origHunk.text,
        writingPrompt: transHunk.writingPrompt ?? origHunk.writingPrompt,
        questions: origHunk.questions.map((origQ, qi) => {
          const transQ = transHunk.questions?.[qi]
          if (!transQ) return origQ
          return {
            ...origQ,
            question: transQ.question ?? origQ.question,
            answer: transQ.answer ?? origQ.answer,
          }
        }),
      }
    }),
  }

  return Response.json({ lesson: translatedLesson })
}
