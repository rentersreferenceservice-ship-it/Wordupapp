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

Rules:
- Only include hunks that actually need changes
- Only correct the specific claims the issues list flags — do not rewrite the whole lesson
- Keep the same warm, friendly, age-appropriate tone
- Preserve paragraph length and structure as closely as possible
- omit correctedQuestions if no question answers need changing`

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return Response.json({ error: 'Could not parse AI response' }, { status: 500 })

  const { corrections } = JSON.parse(jsonMatch[0])

  const changes = corrections.map((c: { hunkNumber: number; correctedText: string; correctedQuestions?: { index: number; answer: string }[] }) => {
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
