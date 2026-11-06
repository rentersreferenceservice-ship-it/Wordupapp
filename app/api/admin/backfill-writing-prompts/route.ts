import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import type { Lesson } from '@/lib/types'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

interface WritingPromptTiers {
  beginner: string
  intermediate: string
  pro: string
}

// Generates the beginner + intermediate tiers only — pro is either the
// existing writingPrompt (preserved as-is) or generated fresh if truly missing.
async function generateWritingPromptTiers(
  hunkText: string,
  ageGroup: string,
  existingPro: string | null,
  client: Anthropic
): Promise<WritingPromptTiers> {
  const ageInstruction =
    ageGroup.includes('6') || ageGroup.toLowerCase().includes('young')
      ? 'Draw a picture and write one sentence about what you learned from this section.'
      : ageGroup.includes('9') || ageGroup.includes('11') || ageGroup.toLowerCase().includes('children')
      ? 'Write 2–3 sentences about what you learned. Tell one fact and what surprised you.'
      : ageGroup.includes('12') || ageGroup.includes('14') || ageGroup.toLowerCase().includes('tween')
      ? 'Write a short paragraph using two facts from this section and one personal connection.'
      : ageGroup.includes('15') || ageGroup.includes('17') || ageGroup.toLowerCase().includes('teen')
      ? 'Write a paragraph using details from this section and explain what this means to you personally.'
      : 'Write a paragraph incorporating the key ideas from this section and reflect on why this topic matters to you.'

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are writing two writing-prompt difficulty tiers for a letterboard lesson for ${ageGroup}.

The hunk text is:
"""
${hunkText}
"""
${existingPro ? `\nThe existing, more advanced "pro" prompt (for reference only, so you don't duplicate it — do not repeat it or match its length/complexity) is: "${existingPro}"\n` : ''}
Write two prompts, each specific to this hunk's content (not generic). Follow these rules strictly — no exceptions, no multi-part questions, no "write a paragraph" instructions, no quoting the text back at the student:

ABSOLUTELY NO yes/no questions, ever. If a prompt could be fully answered with just "yes" or "no," it is wrong, even when a longer answer was "intended" — "Do you think X matters?" is still a yes/no question. Never start with Is/Are/Was/Were/Did/Does/Do/Has/Have/Can/Could/Will/Would/Should.
- Bad: "Do you think modern leaders should keep symbolic roles?" → Good: "What's your take on modern leaders keeping symbolic roles?"
- Bad: "Would you want biogas made from cow poop to power your home?" → Good: "What would you think about having your home powered by cow-poop biogas?"

1. BEGINNER — exactly one short question, under 12 words, about a single explicit fact stated in the hunk. Answerable in a word or short phrase. No interpretation, no opinion, no "why."

2. INTERMEDIATE — exactly one short question, under 20 words, inviting a brief personal reaction or opinion. ONE sentence only — do not add a second sentence of setup or context, do not ask for two things at once. Use vocabulary appropriate for ${ageGroup}.

Respond with ONLY valid JSON, no markdown, no explanation: {"beginner": "...", "intermediate": "..."}`,
    }],
  })

  const content = res.content[0]
  const raw = content.type === 'text' ? content.text.trim() : '{}'
  let parsed: { beginner?: string; intermediate?: string } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) { try { parsed = JSON.parse(match[0]) } catch { /* fall through to defaults below */ } }
  }

  return {
    beginner: parsed.beginner ?? 'What is one thing this section tells you?',
    intermediate: parsed.intermediate ?? ageInstruction,
    pro: existingPro ?? ageInstruction,
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
      const tiers = await generateWritingPromptTiers(hunk.text, lesson.age_group, hunk.writingPrompt ?? null, client)
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
