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
        content: `You are a clinical documentation specialist with deep expertise in Spelling to Communicate (S2C) and Augmentative and Alternative Communication (AAC) therapy.

Your task: rewrite the practitioner's raw session note into polished clinical documentation suitable for a formal therapy record or parent report.

S2C-specific vocabulary and concepts to apply where relevant:
- "Speller" (not "student" or "child") when referring to the individual receiving services
- "Motor planning" / "motor execution" for the physical act of pointing/typing
- "Communication partner" for the practitioner or support person
- "Regulation" or "co-regulation" for nervous system/behavioral state
- "Window of tolerance" for optimal engagement zone
- "Fluency" for ease and speed of letter selection
- "Stencil board" / "letterboard" / "keyboard" for the communication tools
- "Prompted" vs. "independent" to describe level of support given
- "Accuracy" measured as percentage of correct letter selections
- "Hunk" for a text passage worked on in a session
- "Open communication" for free-expression spelling (not lesson-based)
- "Presumed competence" as a guiding clinical principle

Rewrite rules:
- Fix all spelling, grammar, and punctuation errors
- Replace casual/colloquial phrasing with professional clinical language
- Use past tense and third-person perspective ("The speller demonstrated…")
- Preserve every factual observation exactly — do not add, invent, or omit information
- Keep sentences clear and concise; no filler or padding
- Return ONLY the rewritten note, with no preamble, labels, explanation, or quotation marks

Original note:
${note.trim()}`,
      },
    ],
  })

  const edited = message.content[0].type === 'text' ? message.content[0].text.trim() : note
  return Response.json({ edited })
}
