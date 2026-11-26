import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { pickYoutubeVideo, YoutubeQuotaError } from '@/lib/youtubePicker'
import { Resend } from 'resend'

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

  // One-time reminder the owner asked for (Dec 3, 2026): request a higher
  // YouTube quota. This job runs once a day, so it emails exactly once.
  if (new Date().toISOString().startsWith('2026-12-03')) {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Word Up <onboarding@resend.dev>',
      to: 'Wordups2c@gmail.com',
      subject: 'Reminder: ask Google for a higher YouTube limit',
      html: `
        <h2>Time to raise the YouTube limit</h2>
        <p>Right now the app can do about 100 YouTube searches a day (about 25 new lessons). This asks Google to raise it — free, about 20 minutes.</p>
        <h3>Part 1 — find the project</h3>
        <ol>
          <li>Go to <a href="https://console.cloud.google.com">console.cloud.google.com</a> and sign in (try Wordups2c@gmail.com first).</li>
          <li>Top left, click the project name and pick the Word Up project.</li>
          <li>Search for <b>YouTube Data API v3</b> and open it.</li>
          <li>Open the <b>Quotas</b> tab — you should see <b>Queries per day: 10,000</b>.</li>
        </ol>
        <h3>Part 2 — the request form</h3>
        <ol>
          <li>Search for <b>"YouTube API Services – Audit and Quota Extension Form"</b> and open it.</li>
          <li><b>What does your app do?</b> "Word Up is an educational platform for nonspeaking students who communicate by spelling on a letterboard. Each AI-generated lesson has 3–4 short sensory-break activities, and we search YouTube to attach a short, kid-safe educational video to each one."</li>
          <li><b>How do you use the API?</b> "Search only (search.list with safeSearch=strict, plus videos.list for duration). Videos are shown with YouTube's own player or linked on YouTube. We don't download, store or change videos."</li>
          <li><b>How much quota?</b> "100,000 units per day (about 250 lessons a day)."</li>
          <li>If asked for screenshots, take one of a lesson page showing a video QR code.</li>
          <li>Submit. Google usually replies by email within days to a few weeks.</li>
        </ol>
        <p>When Google approves it, tell Claude so it can let the nightly video job do more each night.</p>
      `,
    }).catch(() => {})
  }

  return Response.json({ searches, picked, noMatch, quotaHit })
}
