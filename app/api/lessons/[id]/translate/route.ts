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
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: 'You are a professional translator. You output ONLY valid JSON — no markdown, no explanation, no code fences. All string values in your JSON must use \\n for line breaks (never literal newlines inside strings). Your entire response must be a single JSON object that can be passed directly to JSON.parse().',
    messages: [{
      role: 'user',
      content: `Translate this S2C (Spelling to Communicate) educational lesson from English to ${language}.

Rules:
- Translate all text naturally — not word-for-word literal. Sound fluent and natural in ${language}.
- Maintain the same warm, conversational tone and the same age-appropriate reading level.
- Keep ALL CAPS answers in ALL CAPS (translate the words but keep them uppercase).
- Preserve fill-in-the-blank blanks — the blank indicator should remain in the same position in the question.
- Translate hashtags to be natural for ${language} speakers (same topics, localized phrasing).
- CRITICAL: All string values must use \\n for newlines — never put a literal newline inside a JSON string value.
- Return ONLY the JSON object with exactly the same structure as the input. Nothing else.

Input:
${JSON.stringify(contentToTranslate, null, 2)}`,
    }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip markdown fences if present
  let raw = responseText.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  // Extract the outermost JSON object
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[translate] No JSON object found. Response start:', responseText.slice(0, 300))
    return Response.json({ error: 'Could not parse translation response' }, { status: 500 })
  }

  let translated: typeof contentToTranslate
  try {
    translated = JSON.parse(jsonMatch[0])
  } catch (firstErr) {
    // Escape literal control characters that snuck into string values.
    // Match each JSON string token (dotAll flag handles multiline content inside strings).
    try {
      const cleaned = jsonMatch[0]
        .replace(/"(?:[^"\\]|\\.)*"/gs, (token) =>
          token
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
        )
        .replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
      translated = JSON.parse(cleaned)
    } catch {
      console.error('[translate] Parse failed. First 1500 chars:', jsonMatch[0].slice(0, 1500))
      console.error('[translate] Original parse error:', firstErr)
      return Response.json({ error: 'Invalid JSON from translation' }, { status: 500 })
    }
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
