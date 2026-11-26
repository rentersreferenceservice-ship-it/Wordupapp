import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLesson } from '@/lib/lessonStore'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'
import type { Lesson } from '@/lib/types'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

function buildPrompt(lesson: Lesson): string {
  const hunkTexts = lesson.hunks.map(h => {
    const questions = h.questions.map(q => `Q: ${q.question}${q.answer ? ` A: ${q.answer}` : ''}`).join('\n')
    return `Section ${h.number}:\n${h.text}\n${questions}`
  }).join('\n\n')

  return `You are a fact-checker reviewing an educational lesson for children and teens with complex communication needs (letterboard communication / AAC users).

Review the lesson titled "${lesson.title}" for factual accuracy.

IMPORTANT — only flag issues that are clearly and materially wrong:
- Incorrect numbers, dates, or statistics
- Wrong names, locations, or attributions
- Definitions or claims that are factually opposite to the truth
- Fabricated or unverifiable citations

Do NOT flag:
- Minor simplifications or generalisations that are essentially correct
- Different phrasing that conveys the same meaning
- Imprecise but not misleading statements
- Reasonable educational simplifications appropriate for the age group
- Dates — whether the lesson gives a full date or a year only, accept it as-is. Do not flag a year as incomplete because it lacks a month and day, and do not flag a full date as needing to be shortened. Whatever date format the lesson uses is correct.

This is an educational lesson for children — a reasonable level of simplification is expected and acceptable. Only raise an issue if a student would learn something genuinely incorrect.

If ALL information is accurate (or only contains acceptable simplifications), respond with exactly this on the first line:
VERIFIED: No issues found.

If there are clearly and materially wrong facts, respond with exactly this on the first line, then list each issue with the specific correction:
ISSUES FOUND:
- [specific issue and the correct fact to use instead]
- [specific issue and the correct fact to use instead]

LESSON CONTENT:
${hunkTexts}

${lesson.citations.length > 0 ? `Citations provided:\n${lesson.citations.join('\n')}` : ''}`
}

async function checkWithPerplexity(prompt: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) return `ISSUES FOUND:\n- Perplexity API error: ${res.status}`
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? 'No response received.'
}

async function checkWithClaudeOpus(prompt: string): Promise<string> {
  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8000,
      // Think first: without it the reply often opened with "ISSUES FOUND",
      // then concluded every item was fine — reported as issues.
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
    return text || 'No response received.'
  } catch {
    return 'CLAUDE_UNAVAILABLE'
  }
}

// Perplexity alone used to decide "Verified", and it often flags things that
// aren't errors (or lists an item and then calls it accurate), so lessons
// needed several rounds. When it flags issues, Claude reviews each claimed
// issue against the same rules. Returns the issues that are real errors
// (empty when none are), or null if the review couldn't run.
async function reviewPerplexityIssues(lessonPrompt: string, perplexityResult: string): Promise<string[] | null> {
  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      messages: [{
        role: 'user',
        content: `${lessonPrompt}

----
A first fact-checker reviewed this lesson and reported the issues below. Decide, for each one, whether it is a REAL, material factual error under the rules above (a student would learn something genuinely incorrect). Treat as NOT real: items the checker itself says are accurate, acceptable simplifications, phrasing preferences, date-format complaints, figures that are correct for the year the lesson states, and claims you cannot confirm are wrong.

FIRST CHECKER'S REPORT:
${perplexityResult}

Reply in exactly this format:
If none are real errors, the first line is exactly: NO REAL ISSUES
Otherwise the first line is exactly: REAL ISSUES:
followed by one line per real error, starting with "- ", giving the issue and the correct fact.`,
      }],
    })
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
    if (!text) return null
    if (text.toUpperCase().startsWith('NO REAL ISSUES')) return []
    return text.split('\n').map(l => l.trim()).filter(l => l.startsWith('- '))
  } catch {
    return null
  }
}

// Two checks plus a review step can take a couple of minutes.
export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const prompt = buildPrompt(lesson)

  const [perplexityResult, claudeResult] = await Promise.all([
    checkWithPerplexity(prompt),
    checkWithClaudeOpus(prompt),
  ])

  const perplexityRawClean = perplexityResult.trimStart().toUpperCase().startsWith('VERIFIED')
  const perplexityFailed = perplexityResult.includes('Perplexity API error')
  const claudeUnavailable = claudeResult === 'CLAUDE_UNAVAILABLE'
  const claudeClean = !claudeUnavailable && claudeResult.trimStart().toUpperCase().startsWith('VERIFIED')

  // Referee Perplexity's flags (not when its API call itself failed).
  let realIssues: string[] | null = null
  if (!perplexityRawClean && !perplexityFailed) {
    realIssues = await reviewPerplexityIssues(prompt, perplexityResult)
  }
  const perplexityClean = perplexityRawClean || (claudeClean && realIssues !== null && realIssues.length === 0)
  // What the lesson page shows and "Apply fixes" uses: only the real issues.
  const perplexityShown = perplexityRawClean || realIssues === null
    ? perplexityResult
    : realIssues.length === 0
      ? 'VERIFIED: No issues found. (Perplexity raised notes, but on review none were real errors.)'
      : `ISSUES FOUND:\n${realIssues.join('\n')}`

  const resend = new Resend(process.env.RESEND_API_KEY)

  if (perplexityClean) {
    await getSupabase().from('lessons').update({ verified: true }).eq('id', id)

    await resend.emails.send({
      from: 'Word Up <onboarding@resend.dev>',
      to: 'Wordups2c@gmail.com',
      bcc: 'Wordups2c@gmail.com',
      subject: `✓ Auto-Verified — ${lesson.title}`,
      html: `
        <h2>✓ Lesson Auto-Verified</h2>
        <p><strong>${lesson.title}</strong> was confirmed accurate by Perplexity AI and has been automatically marked as Verified.</p>
        <hr />
        <h3>Perplexity AI:</h3>
        <p>${perplexityResult.replace(/\n/g, '<br />')}</p>
        ${perplexityRawClean ? '' : '<p><em>Perplexity raised notes; Claude reviewed each one and found no real errors.</em></p>'}
        <hr />
        <h3>Claude Opus (Advisory):</h3>
        <p>${claudeUnavailable ? 'Temporarily unavailable.' : claudeResult.replace(/\n/g, '<br />')}</p>
      `,
    })
  } else {
    await resend.emails.send({
      from: 'Word Up <onboarding@resend.dev>',
      to: 'Wordups2c@gmail.com',
      bcc: 'Wordups2c@gmail.com',
      subject: `⚠️ Fact-Check Issues — ${lesson.title}`,
      html: `
        <h2>⚠️ Fact-Check Issues Found</h2>
        <p><strong>Lesson:</strong> ${lesson.title}</p>
        <p>Perplexity AI flagged issues. This lesson has <strong>not</strong> been verified. Please review, edit, and run the fact-check again.</p>
        <hr />
        <h3>Perplexity AI — ⚠️ Issues Found:</h3>
        <p>${perplexityResult.replace(/\n/g, '<br />')}</p>
        ${realIssues && realIssues.length ? `<h3>Real errors after review (what "Apply fixes" will fix):</h3><p>${realIssues.join('<br />')}</p>` : ''}
        <hr />
        <h3>Claude Opus (Advisory) — ${claudeClean ? '✓ Clean' : claudeUnavailable ? '— Unavailable' : '⚠️ Notes'}:</h3>
        <p>${claudeUnavailable ? 'Temporarily unavailable.' : claudeResult.replace(/\n/g, '<br />')}</p>
        <hr />
        <p><a href="https://worduplessongenerator.com/lessons/${id}/edit">Click here to edit this lesson →</a></p>
      `,
    })
  }

  return Response.json({
    perplexity: perplexityShown,
    gemini: claudeUnavailable ? 'Claude Opus was temporarily unavailable.' : claudeResult,
    perplexityClean,
    geminiClean: claudeClean,
    geminiUnavailable: claudeUnavailable,
    autoVerified: perplexityClean,
  })
}
