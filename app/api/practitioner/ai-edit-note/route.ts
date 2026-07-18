import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { note } = await req.json()
  if (!note?.trim()) return Response.json({ error: 'No note provided' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert clinical note editor for a Spelling to Communicate (S2C) practitioner.
Rewrite the following session note to:
- Fix any spelling, grammar, or punctuation errors
- Use clear, professional clinical language appropriate for an S2C therapy record
- Preserve every factual observation — do not add information that wasn't stated
- Keep it concise; do not pad with filler phrases
- Return ONLY the rewritten note, with no preamble, explanation, or quotes

Original note:
${note.trim()}`,
      },
    ],
  })

  const edited = message.content[0].type === 'text' ? message.content[0].text.trim() : note
  return Response.json({ edited })
}
