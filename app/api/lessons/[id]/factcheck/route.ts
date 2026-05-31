import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLesson } from '@/lib/lessonStore'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'
import type { Lesson } from '@/lib/types'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

function buildPrompt(lesson: Lesson): string {
  const hunkTexts = lesson.hunks.map(h => {
    const questions = h.questions.map(q => `Q: ${q.question}${q.answer ? ` A: ${q.answer}` : ''}`).join('\n')
    return `Section ${h.number}:\n${h.text}\n${questions}`
  }).join('\n\n')

  return `You are a fact-checker reviewing an educational lesson for children and teens with complex communication needs (Spelling to Communicate / AAC users).

Review the lesson titled "${lesson.title}" for factual accuracy. Check all facts, dates, names, statistics, and scientific claims.

If ALL information is accurate, respond with exactly this on the first line:
VERIFIED: No issues found.

If there are ANY inaccuracies, outdated information, or unsupported claims, respond with exactly this on the first line, then list each issue:
ISSUES FOUND:
- [specific issue and correction]
- [specific issue and correction]

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

async function checkWithGemini(prompt: string, attempt = 1): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return 'GEMINI_UNAVAILABLE:no_key'
  let res: Response
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )
  } catch {
    return 'GEMINI_UNAVAILABLE:network_error'
  }
  if (res.status === 429 && attempt < 3) {
    await new Promise(r => setTimeout(r, 3000 * attempt))
    return checkWithGemini(prompt, attempt + 1)
  }
  if (!res.ok) return `GEMINI_UNAVAILABLE:${res.status}`
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.'
}

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

  const [perplexityResult, geminiResult] = await Promise.all([
    checkWithPerplexity(prompt),
    checkWithGemini(prompt),
  ])

  const perplexityClean = perplexityResult.trimStart().toUpperCase().startsWith('VERIFIED')
  const geminiUnavailable = geminiResult.startsWith('GEMINI_UNAVAILABLE')
  const geminiClean = !geminiUnavailable && geminiResult.trimStart().toUpperCase().startsWith('VERIFIED')
  const bothClean = perplexityClean && geminiClean

  const resend = new Resend(process.env.RESEND_API_KEY)

  if (bothClean) {
    await getSupabase().from('lessons').update({ verified: true }).eq('id', id)

    await resend.emails.send({
      from: 'Word Up <onboarding@resend.dev>',
      to: 'Wordups2c@gmail.com',
      bcc: 'Wordups2c@gmail.com',
      subject: `✓ Auto-Verified — ${lesson.title}`,
      html: `
        <h2>✓ Lesson Auto-Verified</h2>
        <p><strong>${lesson.title}</strong> passed both AI fact-checks and has been automatically marked as Verified.</p>
        <hr />
        <h3>Perplexity AI:</h3>
        <p>${perplexityResult.replace(/\n/g, '<br />')}</p>
        <hr />
        <h3>Google Gemini:</h3>
        <p>${geminiResult.replace(/\n/g, '<br />')}</p>
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
        <p>One or both AI sources flagged issues. This lesson has <strong>not</strong> been verified. Please review, edit, and run the fact-check again.</p>
        <hr />
        <h3>Perplexity AI — ${perplexityClean ? '✓ Clean' : '⚠️ Issues Found'}:</h3>
        <p>${perplexityResult.replace(/\n/g, '<br />')}</p>
        <hr />
        <h3>Google Gemini — ${geminiClean ? '✓ Clean' : '⚠️ Issues Found'}:</h3>
        <p>${geminiResult.replace(/\n/g, '<br />')}</p>
        <hr />
        <p><a href="https://worduplessongenerator.com/lessons/${id}/edit">Click here to edit this lesson →</a></p>
      `,
    })
  }

  return Response.json({
    perplexity: perplexityResult,
    gemini: geminiUnavailable ? 'Gemini could not be reached. Perplexity result is shown above.' : geminiResult,
    perplexityClean,
    geminiClean,
    geminiUnavailable,
    autoVerified: bothClean,
  })
}
