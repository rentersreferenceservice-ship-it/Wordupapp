import Anthropic from '@anthropic-ai/sdk'
import type { Lesson } from './types'
import { pickYoutubeVideo, YoutubeQuotaError } from './youtubePicker'

// Extra short "Watch & listen" clips for sensory-rich lessons, separate from
// the VAKT activity videos (which only appear on 2–3 pages). A lesson about
// emergency-vehicle sirens or kaleidoscopes should let kids SEE and HEAR the
// thing on most pages; a lesson about fractions doesn't need any.
//   high sensory  -> a clip on most pages (up to 6)
//   medium        -> up to 3
//   low           -> none
// Clips are found with web search first, so they barely touch YouTube's
// daily search quota (see lib/youtubePicker.ts).

type Plan = { level: 'high' | 'medium' | 'low'; clips: { page: number; query: string; description: string }[] }

async function planClips(lesson: Lesson): Promise<Plan | null> {
  const pages = lesson.hunks.map(h => `Page ${h.number}: ${h.text.replace(/\s+/g, ' ').slice(0, 500)}`).join('\n')
  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 6000,
    output_config: { effort: 'low' },
    messages: [{
      role: 'user',
      content: `Lesson "${lesson.title}" for ${lesson.ageGroup}.

${pages}

Decide how much this lesson would benefit from short videos the student can watch or listen to:
- "high": the topic is strongly visual or audio — things kids should SEE or HEAR to understand (sirens and emergency vehicles, musical instruments, animals and their sounds, kaleidoscopes, weather, volcanoes, dances, machines in motion). Plan a clip for most pages (up to 6).
- "medium": some pages describe something worth seeing or hearing. Plan up to 3 clips, only for those pages.
- "low": abstract topics (math, grammar, dates, opinions). Plan none.

For each clip: the page number, a 2–5 word YouTube search, and a short description of exactly what the student will see or hear (under 12 words). Each clip should show the specific thing that page is about — e.g. separate clips for a police siren, a fire truck siren and an ambulance siren, so kids can compare them. For a sound, the search should be for the sound itself (e.g. "ambulance siren sound").

Reply with ONLY JSON: {"level":"high","clips":[{"page":2,"query":"police car siren lights","description":"See and hear a police car's lights and siren"}]}`,
    }],
  })
  const text = message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
  try {
    const plan = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as Plan
    if (!['high', 'medium', 'low'].includes(plan.level) || !Array.isArray(plan.clips)) return null
    const max = plan.level === 'high' ? 6 : plan.level === 'medium' ? 3 : 0
    const seen = new Set<number>()
    plan.clips = plan.clips.filter(c => lesson.hunks.some(h => h.number === c.page) && !seen.has(c.page) && seen.add(c.page) && c.query).slice(0, max)
    return plan
  } catch {
    return null
  }
}

export async function addWatchVideos(lesson: Lesson): Promise<Lesson> {
  const plan = await planClips(lesson)
  if (!plan || !plan.clips.length) return lesson
  const picks = await Promise.all(plan.clips.map(async c => {
    try {
      const p = await pickYoutubeVideo({ query: c.query, description: c.description, lessonTitle: lesson.title, ageGroup: lesson.ageGroup, maxSeconds: 120 })
      return p ? { page: c.page, video: { ...p, description: c.description } } : null
    } catch (e) {
      if (e instanceof YoutubeQuotaError) return null
      return null
    }
  }))
  return {
    ...lesson,
    hunks: lesson.hunks.map(h => {
      const pick = picks.find(p => p && p.page === h.number)
      return pick ? { ...h, watchVideo: pick.video } : h
    }),
  }
}
