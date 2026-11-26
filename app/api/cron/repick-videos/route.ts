import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { pickYoutubeVideo, YoutubeQuotaError } from '@/lib/youtubePicker'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Nightly, just after YouTube's daily quota resets (midnight Pacific): pick
// checked videos for VAKT questions flagged youtubeNeedsPick (bad videos the
// audit removed). Uses at most BUDGET searches so about half the day's
// ~100 searches stay free for generating new lessons.
const BUDGET = 50

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, age_group, hunks')
    .filter('hunks', 'cs', JSON.stringify([{ questions: [{ youtubeNeedsPick: true }] }]))
    .limit(40)

  let searches = 0, picked = 0, noMatch = 0
  let quotaHit = false
  for (const lesson of lessons ?? []) {
    if (searches >= BUDGET || quotaHit) break
    let changed = false
    for (const hunk of lesson.hunks) {
      for (let i = 0; i < hunk.questions.length; i++) {
        const q = hunk.questions[i]
        if (!q.youtubeNeedsPick || searches >= BUDGET || quotaHit) continue
        try {
          searches++
          const p = await pickYoutubeVideo({ query: q.youtubeQuery, description: q.youtubeDescription, activity: q.question, lessonTitle: lesson.title, ageGroup: lesson.age_group })
          const { youtubeNeedsPick, ...rest } = q
          void youtubeNeedsPick
          // No good match: stop retrying it (the QR falls back to a search link).
          hunk.questions[i] = p ? { ...rest, youtubeVideoId: p.videoId, youtubeVideoTitle: p.title, youtubeDuration: p.duration } : rest
          if (p) picked++; else noMatch++
          changed = true
        } catch (e) {
          if (e instanceof YoutubeQuotaError) { quotaHit = true; searches-- }
        }
      }
    }
    if (changed) await supabase.from('lessons').update({ hunks: lesson.hunks }).eq('id', lesson.id)
  }

  return Response.json({ searches, picked, noMatch, quotaHit })
}
