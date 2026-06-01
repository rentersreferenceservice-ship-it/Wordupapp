import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLesson } from '@/lib/lessonStore'
import { getSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // ── Step 2: confirm & save ─────────────────────────────────────────────────
  if (body.confirm && body.correctedHunks) {
    const lesson = await getLesson(id)
    if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

    const updatedHunks = lesson.hunks.map(h => {
      const fix = body.correctedHunks.find((c: { hunkNumber: number }) => c.hunkNumber === h.number)
      if (!fix) return h
      return {
        ...h,
        text: fix.correctedText ?? h.text,
        questions: h.questions.map((q, qi) => {
          const qfix = fix.correctedQuestions?.find((cq: { index: number }) => cq.index === qi)
          return qfix ? { ...q, answer: qfix.answer } : q
        }),
      }
    })

    const { error } = await getSupabase()
      .from('lessons')
      .update({ hunks: updatedHunks, verified: false })
      .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  // ── Step 1: generate preview ───────────────────────────────────────────────
  const { issues } = body
  if (!issues) return Response.json({ error: 'Missing issues' }, { status: 400 })

  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const lessonContent = lesson.hunks.map(h => ({
    number: h.number,
    text: h.text,
    questions: h.questions.map((q, i) => ({ index: i, question: q.question, answer: q.answer })),
  }))

  const prompt = `You are editing an S2C (Spelling to Communicate) educational lesson to correct specific factual issues found by a fact-checker. The lesson is titled "${lesson.title}" for age group: ${lesson.ageGroup}.

ISSUES TO CORRECT:
${issues}

CURRENT LESSON CONTENT:
${JSON.stringify(lessonContent, null, 2)}

Return ONLY valid JSON — no explanation, no markdown, no code block. Return exactly this structure:
{
  "corrections": [
    {
      "hunkNumber": 2,
      "correctedText": "full corrected paragraph text",
      "correctedQuestions": [
        { "index": 0, "answer": "corrected answer only if the answer itself contains an inaccuracy" }
      ]
    }
  ]
}

Rules — READ CAREFULLY:
- Rewrite ONLY the sentence(s) that directly contain the identified inaccuracy. Leave every other sentence word-for-word identical.
- When rewriting an affected sentence, make it fully factually accurate. Use the correct fact from the issues report. You may rephrase the sentence as needed to make the fact accurate — but match the same reading level, tone, and approximate length.
- Do NOT add, remove, or reorder any sentences. The corrected paragraph must have the same sentence count as the original.
- Do NOT touch any sentence that is not directly involved in the identified issue.
- Only include hunks that actually need changes.
- Omit correctedQuestions unless the answer itself contains the specific inaccuracy being corrected.`

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return Response.json({ error: 'Could not parse AI response' }, { status: 500 })

  let parsed: { corrections?: unknown[] }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return Response.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }
  const corrections = parsed.corrections
  if (!Array.isArray(corrections)) return Response.json({ error: 'AI response missing corrections array' }, { status: 500 })

  type Correction = { hunkNumber: number; correctedText: string; correctedQuestions?: { index: number; answer: string }[] }
  const changes = (corrections as Correction[]).map((c) => {
    const original = lesson.hunks.find(h => h.number === c.hunkNumber)
    return {
      hunkNumber: c.hunkNumber,
      originalText: original?.text ?? '',
      correctedText: c.correctedText,
      correctedQuestions: c.correctedQuestions ?? [],
    }
  })

  return Response.json({ changes })
}
