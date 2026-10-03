import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You write simple, calming visual picture-book stories for nonspeaking and autistic students, in the exact style of "How Big Is Joey's World?" — one short, plain, concrete sentence per page, present tense, no plot complexity, just a clear sequence of single ideas (e.g. "This is Joey." "This is Joey's house." "This is where Joey lives on planet Earth, as seen from space."). Never use metaphor, sarcasm, or ambiguity. Adjust sentence length and vocabulary to the requested age group — shorter and more literal for younger children, a little more descriptive for teens/adults, but always plain and concrete, never flowery.

If no main character is given, do not invent one — write directly about the topic itself (e.g. plain factual or sequential statements), still one plain concrete sentence per page.

For each page you also write an "imagePrompt" — a ready-to-paste description for an AI image generator (like ChatGPT/DALL-E) to illustrate that exact page. Every imagePrompt must restate the character's appearance in full (using the character description provided) so each prompt works on its own, without needing the others for context, and should request a warm, simple, children's book illustration style (soft watercolor or gouache, not photorealistic).

When given a genre or field of study (e.g. science, social story, life skills, history, friendship), keep every page's content and vocabulary grounded in that subject while still following the one-plain-sentence-per-page style above.

Respond with ONLY a JSON object, no markdown fences, no commentary, in this exact shape:
{"title": "...", "pages": [{"caption": "...", "imagePrompt": "..."}, ...]}
The first page's caption introduces the main character (like "This is Joey."); do not generate a separate cover entry — the title plus the first page's imagePrompt together serve as the cover.`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const topic: string = (body.topic || '').trim()
  const characterName: string = (body.characterName || '').trim()
  const characterDescription: string = (body.characterDescription || '').trim()
  const genre: string = (body.genre || '').trim()
  const ageGroup: string = body.ageGroup || 'Children (ages 9–11)'
  const pageCount: number = Math.min(Math.max(parseInt(body.pageCount, 10) || 9, 3), 24)

  if (!topic) return Response.json({ error: 'A topic is required' }, { status: 400 })

  const characterLine = characterName
    ? ` The main character is named ${characterName}. Character appearance: ${characterDescription || "(use your judgement for a simple, warm children's book character design)"}.`
    : ' There is no specific main character — write directly about the topic.'

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Write a ${pageCount}-page picture book about "${topic}", for a ${ageGroup} reader.${genre ? ` Genre / field of study: ${genre}.` : ''}${characterLine}`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') return Response.json({ error: 'Unexpected response from AI' }, { status: 500 })

  const raw = content.text.trim()
  let parsed: { title: string; pages: { caption: string; imagePrompt: string }[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    try {
      parsed = JSON.parse(stripped)
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/)
      if (!match) return Response.json({ error: 'Could not read the generated story. Please try again.' }, { status: 500 })
      parsed = JSON.parse(match[0])
    }
  }

  return Response.json(parsed)
}
