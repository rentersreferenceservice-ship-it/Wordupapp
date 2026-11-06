import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import type { Lesson, Question } from '@/lib/types'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

interface WritingPromptTiers {
  beginner: string
  intermediate: string
  pro: string
}

// Generates all three tiers fresh. existingPro (if any) is used only as loose
// thematic inspiration — it is no longer preserved verbatim, since Pro prompts
// are also subject to the yes/no ban and the no-fact-recall rule.
async function generateWritingPromptTiers(
  hunkText: string,
  ageGroup: string,
  existingPro: string | null,
  existingQuestions: Question[],
  client: Anthropic
): Promise<WritingPromptTiers> {
  const alreadyTestedFacts = existingQuestions
    .filter(q => q.type !== 'VAKT' && q.type !== 'OPEN')
    .map(q => `"${q.question}" → ${q.answer}`)
    .join('\n')

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are writing three writing-prompt difficulty tiers (beginner, intermediate, pro) for a letterboard lesson for ${ageGroup}.

The hunk text is:
"""
${hunkText}
"""
${existingPro ? `\nFor loose thematic inspiration only (do not reuse its wording or structure) the previous prompt for this hunk was: "${existingPro}"\n` : ''}
${alreadyTestedFacts ? `\nThis hunk's other questions already test these facts — NEVER ask the student to recall any of these, or anything else directly stated in the text, in ANY tier:\n${alreadyTestedFacts}\n` : ''}
Every tier must ask for the student's own opinion, feeling, or preference — never something answerable by pointing back at the text. Follow these rules strictly, for all three tiers, no exceptions:

ABSOLUTELY NO yes/no questions, ever. NEVER start with Is/Are/Was/Were/Did/Does/Do/Has/Have/Can/Could/Will/Would/Should — no exceptions, not even for a forced choice between two things. Rephrase as a "What" or "Which" question instead.
- Bad: "Do you think modern leaders should keep symbolic roles?" → Good: "What's your take on modern leaders keeping symbolic roles?"
- Bad: "Would you want biogas made from cow poop to power your home?" → Good: "What would you think about having your home powered by cow-poop biogas?"
- Bad: "Would you rather be a pirate captain or a crew member?" → Good: "Which would you rather be — a pirate captain or a crew member?"
- Bad: "Would you want a fluffernutter or a different sandwich?" → Good: "Which sounds better to you — a fluffernutter or a different sandwich?"

1. BEGINNER — one extremely simple opinion or preference question, anchored to something concrete and specific in the hunk. Still answerable in a word or short phrase, but it must require the student's own reaction or choice.
  - Example: "Which animal in this section is your favorite?" NOT "What animal is mentioned in this section?"
  - Example: "What's the coolest part of this to you?" NOT "What year did this happen?"

2. INTERMEDIATE — exactly one short question, under 20 words, inviting a brief personal reaction or opinion. ONE sentence only — do not add a second sentence of setup or context, do not ask for two things at once. Use vocabulary appropriate for ${ageGroup}.

3. PRO — the fuller, open, reflective invitation to write freely. Do not tell the student how long to write or what structure to follow. Still an opinion/reflection prompt, never a request to summarize or restate the text.

Respond with ONLY valid JSON, no markdown, no explanation: {"beginner": "...", "intermediate": "...", "pro": "..."}`,
    }],
  })

  const content = res.content[0]
  const raw = content.type === 'text' ? content.text.trim() : '{}'
  let parsed: { beginner?: string; intermediate?: string; pro?: string } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) { try { parsed = JSON.parse(match[0]) } catch { /* fall through to defaults below */ } }
  }

  return {
    beginner: parsed.beginner ?? 'What is your favorite part of this section?',
    intermediate: parsed.intermediate ?? 'What did you find interesting about this section?',
    pro: parsed.pro ?? existingPro ?? 'What stands out to you about this section?',
  }
}

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const offset = typeof body.offset === 'number' ? body.offset : 0
  const batchSize = 15

  const supabase = getSupabase()
  const client = new Anthropic()

  // Count total lessons still needing prompts
  const { data: rows, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + batchSize - 1)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  let lessonsUpdated = 0
  let hunksUpdated = 0

  for (const row of rows ?? []) {
    const lesson = row as unknown as { id: string; hunks: Lesson['hunks']; age_group: string }
    const hunks = lesson.hunks
    let changed = false
    const updatedHunks: Lesson['hunks'] = []

    for (const hunk of hunks) {
      if (hunk.writingPrompts) {
        updatedHunks.push(hunk)
        continue
      }
      const tiers = await generateWritingPromptTiers(hunk.text, lesson.age_group, hunk.writingPrompt ?? null, hunk.questions, client)
      hunksUpdated++
      changed = true
      updatedHunks.push({ ...hunk, writingPrompts: tiers })
    }

    if (changed) {
      await supabase.from('lessons').update({ hunks: updatedHunks }).eq('id', lesson.id)
      lessonsUpdated++
    }
  }

  const done = (rows ?? []).length < batchSize
  return Response.json({ ok: true, lessonsUpdated, hunksUpdated, nextOffset: offset + batchSize, done })
}
