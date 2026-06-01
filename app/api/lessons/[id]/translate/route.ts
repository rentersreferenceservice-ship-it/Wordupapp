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
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `Translate this S2C (Spelling to Communicate) educational lesson from English to ${language}.

Rules:
- Translate all text naturally — not word-for-word literal. Sound fluent and natural in ${language}.
- Maintain the same warm, conversational tone and the same age-appropriate reading level.
- Keep ALL CAPS answers in ALL CAPS (translate the words but keep them uppercase).
- Preserve fill-in-the-blank blanks — the blank indicator should remain in the same position in the question.
- Translate hashtags to be natural for ${language} speakers (same topics, localized phrasing).
- Return ONLY valid JSON with exactly the same structure as the input. No explanation, no markdown.

Input:
${JSON.stringify(contentToTranslate, null, 2)}`,
    }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  const raw = responseText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return Response.json({ error: 'Could not parse translation response' }, { status: 500 })

  let translated: typeof contentToTranslate
  try {
    translated = JSON.parse(jsonMatch[0])
  } catch {
    return Response.json({ error: 'Invalid JSON from translation' }, { status: 500 })
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
