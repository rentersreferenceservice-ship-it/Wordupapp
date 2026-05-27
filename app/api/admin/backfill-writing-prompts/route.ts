import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import type { Lesson } from '@/lib/types'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

async function generateWritingPrompt(hunkText: string, ageGroup: string, client: Anthropic): Promise<string> {
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
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `You are writing a short writing prompt for an S2C (Spelling to Communicate) lesson for ${ageGroup}.

The hunk text is:
"""
${hunkText}
"""

Write a 1–2 sentence writing prompt that invites the student to write a paragraph about the main concept in this hunk. The prompt must be specific to this hunk's content — not generic. Use this age-appropriate framing as a guide: "${ageInstruction}"

Respond with ONLY the writing prompt text, no quotes, no explanation.`,
    }],
  })

  const content = res.content[0]
  return content.type === 'text' ? content.text.trim() : ageInstruction
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
      if (hunk.writingPrompt) {
        updatedHunks.push(hunk)
        continue
      }
      const prompt = await generateWritingPrompt(hunk.text, lesson.age_group, client)
      hunksUpdated++
      changed = true
      updatedHunks.push({ ...hunk, writingPrompt: prompt })
    }

    if (changed) {
      await supabase.from('lessons').update({ hunks: updatedHunks }).eq('id', lesson.id)
      lessonsUpdated++
    }
  }

  const done = (rows ?? []).length < batchSize
  return Response.json({ ok: true, lessonsUpdated, hunksUpdated, nextOffset: offset + batchSize, done })
}
