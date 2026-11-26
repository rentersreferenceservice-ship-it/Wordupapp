import Anthropic from '@anthropic-ai/sdk'

// Picks the YouTube video for a VAKT sensory break. Taking the first search
// result put wrong videos in lessons (a "lizard sunning on a rock" search
// returned someone measuring rock temperature, and a "lizard man" politics
// clip). Now: get several short candidates, then have a low-cost model choose
// the one that actually shows what the activity describes and is suitable
// for the age group — or none.

export interface PickedVideo { videoId: string; title: string; duration: string }

function isoSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
}

function formatDuration(secs: number): string {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

type PickOpts = {
  query: string
  description?: string
  activity?: string
  lessonTitle: string
  ageGroup: string
  maxSeconds?: number
}

// YouTube allows ~100 searches a day (each costs 100 of 10,000 quota units),
// so this makes exactly one search per video — 15 results for the same cost.
// Throws YoutubeQuotaError when YouTube refuses, so callers can keep an
// existing video instead of treating it as "no good match".
export class YoutubeQuotaError extends Error {}

export async function pickYoutubeVideo(opts: PickOpts): Promise<PickedVideo | null> {
  return pickFromSearch(opts)
}

async function pickFromSearch(opts: {
  query: string
  description?: string // what students should watch, e.g. "Watch a lizard bask on a warm rock"
  activity?: string    // the VAKT question text
  lessonTitle: string
  ageGroup: string
  maxSeconds?: number
}): Promise<PickedVideo | null> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return null
  const maxSeconds = opts.maxSeconds ?? 180

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(opts.query)}&type=video&videoDuration=short&maxResults=15&safeSearch=strict&relevanceLanguage=en&videoEmbeddable=true&key=${key}`
  )
  if (searchRes.status === 403 || searchRes.status === 429) throw new YoutubeQuotaError(`YouTube refused the search (${searchRes.status}) — daily limit likely used up`)
  if (!searchRes.ok) return null
  const searchData = await searchRes.json()
  const items: { id: { videoId: string }; snippet: { title: string; description: string; channelTitle: string } }[] = searchData.items ?? []
  if (!items.length) return null

  const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${items.map(v => v.id.videoId).join(',')}&key=${key}`)
  if (!detailRes.ok) return null
  const details: { id: string; contentDetails: { duration: string } }[] = (await detailRes.json()).items ?? []

  const candidates = items
    .map(v => ({ ...v, secs: isoSeconds(details.find(d => d.id === v.id.videoId)?.contentDetails.duration ?? '') }))
    .filter(v => v.secs > 0 && v.secs <= maxSeconds)
  if (!candidates.length) return null

  try {
    const client = new Anthropic()
    const list = candidates.map((v, i) => `${i + 1}. "${v.snippet.title}" — channel: ${v.snippet.channelTitle} — ${v.snippet.description.slice(0, 160).replace(/\s+/g, ' ')}`).join('\n')
    const message = await client.messages.create({
      model: 'claude-haiku-5-5',
      // This model thinks before answering — 300 tokens ran out before the
      // number was written, which read as "no match".
      max_tokens: 4000,
      output_config: { effort: 'low' },
      messages: [{
        role: 'user',
        content: `Choose a short YouTube video for a sensory break in an educational lesson.

Lesson: "${opts.lessonTitle}" for ${opts.ageGroup}
The video should show: ${opts.description || opts.query}
${opts.activity ? `Activity: ${opts.activity}\n` : ''}
Candidates:
${list}

Pick the best video that shows the right subject in a way that fits the activity. A close match is fine — e.g. any calm video of a lizard basking works for "lizard sunning on a rock".
Reject a video if it is off-topic or only shares a word with the search (e.g. "lizard man" politics, a product ad, an exercise routine, a video game), or if it is news, politics, conspiracy, pranks, scary or violent, adult humor, or clickbait — or otherwise not suitable for ${opts.ageGroup}. Prefer nature and educational channels.
Answer 0 only if every candidate should be rejected.

Reply with ONLY the number.`,
      }],
    })
    const text = message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
    const n = parseInt(text.match(/\d+/)?.[0] ?? '0', 10)
    const chosen = n >= 1 && n <= candidates.length ? candidates[n - 1] : null
    if (!chosen) return null
    return { videoId: chosen.id.videoId, title: chosen.snippet.title, duration: formatDuration(chosen.secs) }
  } catch {
    return null // never fall back to an unchecked video
  }
}
