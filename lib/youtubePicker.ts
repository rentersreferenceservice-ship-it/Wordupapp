import Anthropic from '@anthropic-ai/sdk'

// Picks YouTube videos for lessons (VAKT sensory breaks and "Watch & listen"
// clips). Taking the first search result put wrong videos in lessons (a
// "lizard sunning on a rock" search returned someone measuring rock
// temperature, and a "lizard man" politics clip). Now: gather several short
// candidates, then have a low-cost model choose the one that actually shows
// what the page describes and suits the age group — or none.
//
// Candidates come from a regular web search first (restricted to YouTube):
// that costs nothing against YouTube's quota — just 1 unit to look up the
// videos' titles and lengths. YouTube's own search (100 units, ~100 a day
// total) is only the fallback.

export interface PickedVideo { videoId: string; title: string; duration: string }

type PickOpts = {
  query: string
  description?: string // what students should watch, e.g. "Watch a lizard bask on a warm rock"
  activity?: string    // the VAKT question text
  lessonTitle: string
  ageGroup: string
  maxSeconds?: number
}

type Candidate = { videoId: string; title: string; channel: string; description: string; secs: number }

// Thrown when YouTube refuses (daily quota used up), so callers can keep an
// existing video instead of treating it as "no good match".
export class YoutubeQuotaError extends Error {}

function isoSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
}

function formatDuration(secs: number): string {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

// Titles, channels and lengths for up to 50 ids — 1 quota unit.
async function lookUpVideos(ids: string[], maxSeconds: number): Promise<Candidate[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key || !ids.length) return []
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${ids.slice(0, 50).join(',')}&key=${key}`)
  if (res.status === 403 || res.status === 429) throw new YoutubeQuotaError(`YouTube refused the lookup (${res.status})`)
  if (!res.ok) return []
  const items: { id: string; snippet: { title: string; description: string; channelTitle: string }; contentDetails: { duration: string }; status?: { embeddable?: boolean; madeForKids?: boolean } }[] = (await res.json()).items ?? []
  return items
    .filter(v => v.status?.embeddable !== false)
    .map(v => ({ videoId: v.id, title: v.snippet.title, channel: v.snippet.channelTitle, description: v.snippet.description, secs: isoSeconds(v.contentDetails.duration) }))
    .filter(v => v.secs > 0 && v.secs <= maxSeconds)
}

async function candidatesFromWeb(opts: PickOpts, maxSeconds: number): Promise<Candidate[]> {
  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 4000,
    output_config: { effort: 'low' },
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2, allowed_domains: ['youtube.com'] }],
    messages: [{
      role: 'user',
      content: `Find short YouTube videos (under ${Math.round(maxSeconds / 60)} minutes, Shorts are great) for a ${opts.ageGroup} lesson that clearly show: ${opts.description || opts.query}. Search for: ${opts.query}. Then reply "done".`,
    }],
  })
  const ids = new Set<string>()
  for (const block of message.content) {
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const r of block.content) { const id = videoIdFromUrl(r.url); if (id) ids.add(id) }
    }
  }
  return lookUpVideos([...ids], maxSeconds)
}

async function candidatesFromYoutubeSearch(opts: PickOpts, maxSeconds: number): Promise<Candidate[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(opts.query)}&type=video&videoDuration=short&maxResults=15&safeSearch=strict&relevanceLanguage=en&videoEmbeddable=true&key=${key}`
  )
  if (res.status === 403 || res.status === 429) throw new YoutubeQuotaError(`YouTube refused the search (${res.status}) — daily limit likely used up`)
  if (!res.ok) return []
  const items: { id: { videoId: string } }[] = (await res.json()).items ?? []
  return lookUpVideos(items.map(v => v.id.videoId), maxSeconds)
}

async function choose(candidates: Candidate[], opts: PickOpts): Promise<PickedVideo | null> {
  if (!candidates.length) return null
  try {
    const client = new Anthropic()
    const list = candidates.map((v, i) => `${i + 1}. "${v.title}" — channel: ${v.channel} — ${v.description.slice(0, 160).replace(/\s+/g, ' ')}`).join('\n')
    const message = await client.messages.create({
      model: 'claude-haiku-5-5',
      // This model thinks before answering — a small budget ran out before
      // the number was written, which read as "no match".
      max_tokens: 4000,
      output_config: { effort: 'low' },
      messages: [{
        role: 'user',
        content: `Choose a short YouTube video for an educational lesson.

Lesson: "${opts.lessonTitle}" for ${opts.ageGroup}
The video should show: ${opts.description || opts.query}
${opts.activity ? `Activity: ${opts.activity}\n` : ''}
Candidates:
${list}

Pick the best video that shows the right subject in a way that fits. A close match is fine — e.g. any calm video of a lizard basking works for "lizard sunning on a rock". For a sound (like a siren), pick one where that sound is clearly heard.
Reject a video if it is off-topic or only shares a word with the search (e.g. "lizard man" politics, a product ad, an exercise routine, a video game), or if it is news, politics, conspiracy, pranks, scary or violent, adult humor, or clickbait — or otherwise not suitable for ${opts.ageGroup}. Prefer nature and educational channels.
Answer 0 only if every candidate should be rejected.

Reply with ONLY the number.`,
      }],
    })
    const text = message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
    const n = parseInt(text.match(/\d+/)?.[0] ?? '0', 10)
    const chosen = n >= 1 && n <= candidates.length ? candidates[n - 1] : null
    return chosen ? { videoId: chosen.videoId, title: chosen.title, duration: formatDuration(chosen.secs) } : null
  } catch {
    return null // never fall back to an unchecked video
  }
}

export async function pickYoutubeVideo(opts: PickOpts): Promise<PickedVideo | null> {
  const maxSeconds = opts.maxSeconds ?? 180
  // 1) Web search (no YouTube search quota).
  try {
    const picked = await choose(await candidatesFromWeb(opts, maxSeconds), opts)
    if (picked) return picked
  } catch (e) {
    if (e instanceof YoutubeQuotaError) throw e
  }
  // 2) YouTube's own search as a backup (100 units).
  return choose(await candidatesFromYoutubeSearch(opts, maxSeconds), opts)
}
