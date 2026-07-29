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
          if (!qfix) return q
          return {
            ...q,
            question: qfix.question ?? q.question,
            answer: qfix.answer ?? q.answer,
          }
        }),
      }
    })

    const updatePayload: Record<string, unknown> = { hunks: updatedHunks, verified: false }

    // Apply citation corrections if provided
    if (Array.isArray(body.correctedCitations) && body.correctedCitations.length > 0) {
      const updatedCitations = [...lesson.citations]
      for (const cc of body.correctedCitations as { index: number; citation: string }[]) {
        if (cc.index >= 0 && cc.index < updatedCitations.length) {
          updatedCitations[cc.index] = cc.citation
        }
      }
      updatePayload.citations = updatedCitations
    }

    const { error } = await getSupabase()
      .from('lessons')
      .update(updatePayload)
      .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  // ── Step 1: generate preview ───────────────────────────────────────────────
  const { issues } = body
  if (!issues) return Response.json({ error: 'Missing issues' }, { status: 400 })

  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const lessonContent = {
    hunks: lesson.hunks.map(h => ({
      number: h.number,
      text: h.text,
      questions: h.questions.map((q, i) => ({ index: i, question: q.question, answer: q.answer })),
    })),
    citations: lesson.citations.map((c, i) => ({ index: i, citation: c })),
  }

  const prompt = `You are editing a letterboard educational lesson to correct specific factual issues found by a fact-checker. The lesson is titled "${lesson.title}" for age group: ${lesson.ageGroup}.

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
        {
          "index": 0,
          "question": "corrected question text if the question itself contains an inaccuracy",
          "answer": "corrected answer if the answer itself contains an inaccuracy"
        }
      ]
    }
  ],
  "correctedCitations": [
    { "index": 0, "citation": "corrected citation text" }
  ]
}

Rules — READ CAREFULLY:
- You MUST produce at least one correction. If issues were identified, something in the lesson needs to change — find it and fix it.
- Rewrite ONLY the sentence(s) that directly contain the identified inaccuracy. Leave every other sentence word-for-word identical.
- When rewriting an affected sentence, make it fully factually accurate using the correct fact from the issues report. Match the same reading level, tone, and approximate length.
- Do NOT add, remove, or reorder any sentences. The corrected paragraph must have the same sentence count as the original.
- Do NOT touch any sentence that is not directly involved in the identified issue.
- Only include hunks that actually need changes.
- For correctedQuestions: include an entry if the question TEXT or the answer contains the inaccuracy. Include only the field(s) that need changing — omit "question" if only the answer is wrong, omit "answer" if only the question text is wrong.
- For correctedCitations: if a citation is fabricated or clearly wrong, replace it with the correct citation. If you cannot determine the correct citation with confidence, remove the fabricated one and replace with a note that it needs manual verification.
- Omit correctedCitations entirely if no citations need changing.`

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return Response.json({ error: 'Could not parse AI response' }, { status: 500 })

  let parsed: { corrections?: unknown[]; correctedCitations?: unknown[] }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return Response.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }

  const corrections = parsed.corrections
  if (!Array.isArray(corrections)) return Response.json({ error: 'AI response missing corrections array' }, { status: 500 })

  type CorrectedQuestion = { index: number; question?: string; answer?: string }
  type Correction = { hunkNumber: number; correctedText: string; correctedQuestions?: CorrectedQuestion[] }
  type CorrectedCitation = { index: number; citation: string }

  const changes = (corrections as Correction[]).map((c) => {
    const original = lesson.hunks.find(h => h.number === c.hunkNumber)
    return {
      hunkNumber: c.hunkNumber,
      originalText: original?.text ?? '',
      correctedText: c.correctedText,
      correctedQuestions: c.correctedQuestions ?? [],
    }
  })

  const correctedCitations = Array.isArray(parsed.correctedCitations)
    ? (parsed.correctedCitations as CorrectedCitation[]).map(cc => ({
        index: cc.index,
        originalCitation: lesson.citations[cc.index] ?? '',
        citation: cc.citation,
      }))
    : []

  return Response.json({ changes, correctedCitations })
}
