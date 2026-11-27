import Anthropic from '@anthropic-ai/sdk'
import type { Lesson } from './types'
import { pickYoutubeVideo, YoutubeQuotaError } from './youtubePicker'

// Extra short "Watch & listen" clips for sensory-rich lessons, separate from
// the VAKT activity videos (which only appear on 2–3 pages). A lesson about
// emergency-vehicle sirens or kaleidoscopes should let kids SEE and HEAR the
// thing on most pages; a lesson about fractions doesn't need any.
//   high sensory  -> a clip on most pages (up to 8, one per page)
//   medium        -> up to 4
//   low           -> none
// Everyday-life topics (vehicles, helpers, weather, animals, cooking…) count
// as high. A page that gets a clip drops its old VAKT activity video, so
// there's one video per page, not two of the same thing.
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
- "high": the topic is about things kids can SEE or HEAR in real life — especially everyday life: vehicles and transportation, community helpers and jobs, emergency vehicles and sirens, animals and their sounds, weather, cooking and food, household things, places, sports, holidays and celebrations, musical instruments, nature, machines in motion, kaleidoscopes, dances. Plan a clip for every page where there is something specific to see or hear (up to 8, one per page).
- "medium": some pages describe something worth seeing or hearing. Plan up to 4 clips, only for those pages.
- "low": abstract topics (math, grammar, dates, opinions). Plan none.

For each clip: the page number, a 2–5 word YouTube search, and a short description of exactly what the student will see or hear (under 12 words). Each clip should show the specific thing that page is about — e.g. separate clips for a police siren, a fire truck siren and an ambulance siren, so kids can compare them. For a sound, the search should be for the sound itself (e.g. "ambulance siren sound").

Reply with ONLY JSON: {"level":"high","clips":[{"page":2,"query":"police car siren lights","description":"See and hear a police car's lights and siren"}]}`,
    }],
  })
  const text = message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
  try {
    const plan = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as Plan
    if (!['high', 'medium', 'low'].includes(plan.level) || !Array.isArray(plan.clips)) return null
    const max = plan.level === 'high' ? 8 : plan.level === 'medium' ? 4 : 0
    const seen = new Set<number>()
    plan.clips = plan.clips.filter(c => lesson.hunks.some(h => h.number === c.page) && !seen.has(c.page) && seen.add(c.page) && c.query).slice(0, max)
    return plan
  } catch {
    return null
  }
}

// One video per page: the new clip replaces the page's VAKT activity video
// (the activity question itself stays).
export function withoutActivityVideo(h: Lesson['hunks'][number]): Lesson['hunks'][number] {
  return {
    ...h,
    questions: h.questions.map(q => {
      if (q.type !== 'VAKT') return q
      const { youtubeVideoId, youtubeVideoTitle, youtubeDuration, youtubeQuery, youtubeDescription, ...rest } = q as typeof q & { youtubeNeedsPick?: boolean }
      void youtubeVideoId; void youtubeVideoTitle; void youtubeDuration; void youtubeQuery; void youtubeDescription
      const { youtubeNeedsPick, ...clean } = rest as typeof rest & { youtubeNeedsPick?: boolean }
      void youtubeNeedsPick
      return clean
    }),
  }
}

export async function addWatchVideos(lesson: Lesson, opts: { webOnly?: boolean } = {}): Promise<Lesson> {
  const plan = await planClips(lesson)
  // Keep clips a page already has; only fill pages without one.
  if (plan) plan.clips = plan.clips.filter(c => !lesson.hunks.find(h => h.number === c.page)?.watchVideo)
  if (!plan || !plan.clips.length) return { ...lesson, hunks: lesson.hunks.map(h => (h.watchVideo ? withoutActivityVideo(h) : h)) }
  const picks = await Promise.all(plan.clips.map(async c => {
    try {
      const p = await pickYoutubeVideo({ query: c.query, description: c.description, lessonTitle: lesson.title, ageGroup: lesson.ageGroup, maxSeconds: 120, webOnly: opts.webOnly })
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
      if (pick) return withoutActivityVideo({ ...h, watchVideo: pick.video })
      return h.watchVideo ? withoutActivityVideo(h) : h
    }),
  }
}
