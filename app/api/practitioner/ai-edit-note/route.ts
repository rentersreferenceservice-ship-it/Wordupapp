import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { fixCapitalization } from '@/lib/fixCapitalization'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { note } = await req.json()
  if (!note?.trim()) return Response.json({ error: 'No note provided' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    // Room for the model's thinking plus the note — at 1024 long notes
    // were cut off mid-way.
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are a clinical documentation specialist with deep expertise in letterboard-based communication and Augmentative and Alternative Communication (AAC) therapy.

Your task: rewrite the practitioner's raw session note — which may have been dictated aloud — into polished clinical documentation suitable for a formal therapy record or parent report.

STEP 1 — Clean up dictation artifacts first:
- Remove all filler and pause words: "uh", "um", "uh huh", "like", "you know", "so", "I mean", "kind of", "sort of", "basically", "right", "okay so", "and then", "just", "literally", "honestly"
- Remove false starts and self-corrections (e.g. "she was — the speller was…" → keep only the clean version)
- Remove repeated words from hesitation (e.g. "he he pointed" → "he pointed")
- Remove trailing thoughts that trail off without completing a sentence

STEP 2 — Rewrite clinically using letterboard/AAC vocabulary where appropriate:
- "Speller" (not "student", "kid", "child", or "he/she" alone) for the individual receiving services
- "Motor planning" / "motor execution" for the physical act of pointing or typing
- "Communication partner" for the practitioner or support person
- "Regulation" or "co-regulation" for nervous system / behavioral state
- "Window of tolerance" for the optimal engagement zone
- "Fluency" for ease and speed of letter selection
- "Letterboard" / "stencil board" / "keyboard" for communication tools
- "Prompted" vs. "independent" for level of support provided
- "Accuracy" measured as a percentage of correct letter selections
- "Hunk" for a text passage worked on during the session
- "Open communication" for free-expression spelling outside of lesson content
- "Presumed competence" as a guiding clinical principle

STEP 3 — Final polish:
- Use past tense and third-person perspective ("The speller demonstrated…", "The practitioner provided…")
- Write in complete, professional sentences
- Preserve every factual observation exactly — do not add, invent, or omit any clinical detail
- Keep it concise; no padding or filler phrases

STEP 4 — Proofread before returning:
- Check every sentence for correct punctuation: periods at the end of sentences, commas where needed, apostrophes in contractions and possessives, and correct question marks
- Check capitalization: the first word of every sentence, names of people and places, and "I"
- Fix spelling and grammar mistakes, including words dictation software misheard
- This includes the speller's quoted words: the note was dictated, so their capitalization and punctuation came from dictation software, not the speller — capitalize and punctuate quotes properly (e.g. "i like lava" → "I like lava.", "can we go outside" → "Can we go outside?")
- But never change WHICH words the speller spelled inside a quote — keep their exact word choices

- Return ONLY the finished clinical note — no preamble, labels, explanation, or quotation marks

Original note:
${note.trim()}`,
      },
    ],
  })

  // The reply usually starts with a thinking block and the note comes after
  // it. Reading only content[0] meant the original note was silently handed
  // back as the "AI version" — no capitalization or punctuation fixes at all.
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
  if (!text) return Response.json({ error: 'The AI did not return a note — please try again.' }, { status: 502 })
  if (message.stop_reason === 'max_tokens') {
    return Response.json({ error: 'This note is too long to convert in one go — try converting it in two parts.' }, { status: 502 })
  }
  return Response.json({ edited: fixCapitalization(text) })
}
