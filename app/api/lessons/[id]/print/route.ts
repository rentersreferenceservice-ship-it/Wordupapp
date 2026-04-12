import { NextRequest } from 'next/server'
import { getLesson } from '@/lib/lessonStore'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import type { QuestionType } from '@/lib/types'
import { auth } from '@clerk/nextjs/server'
import { getUserUsage, incrementPrints, MONTHLY_LIMIT } from '@/lib/usageStore'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const { userId } = await auth()
  if (!userId) return new Response('Login required', { status: 401 })

  const usage = getUserUsage(userId)
  if (!usage.isSubscribed) return new Response('Subscription required', { status: 403 })
  if (usage.lessonsThisMonth + usage.printsThisMonth >= MONTHLY_LIMIT) return new Response('Monthly print limit reached', { status: 403 })

  incrementPrints(userId)

  const logoPath = path.join(process.cwd(), 'public', 'word_up_clean.jpeg')
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : null

  const hunksHtml = lesson.hunks.map(hunk => {
    const questionsHtml = hunk.questions.map(q => `
      <div class="question">
        <div style="color: ${QUESTION_COLORS[q.type]}; font-weight: bold;">${q.question}</div>
        ${q.answer ? `<div class="answer">${q.answer}</div>` : ''}
      </div>
    `).join('')

    return `
      <div class="hunk">
        ${hunk.imageUrl ? `<img src="${hunk.imageUrl}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
        <p class="hunk-text">${hunk.text}</p>
        ${questionsHtml}
      </div>
    `
  }).join('')

  const citationsHtml = lesson.citations.map((c, i) => `<p class="citation">${i + 1}. ${c}</p>`).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e1e1e; }
        .page { padding: 0; }
        .header { text-align: center; margin-bottom: 16px; }
        .logo { width: 140px; margin-bottom: 8px; }
        .credit { font-size: 9pt; color: #666; margin-bottom: 4px; }
        .title { font-size: 16pt; font-weight: bold; margin-bottom: 4px; }
        .hashtags { font-size: 8pt; color: #3b82f6; margin-bottom: 16px; }
        .hunk { margin-bottom: 16px; }
        .hunk-text { margin-bottom: 8px; line-height: 1.5; }
        .question { margin-bottom: 4px; }
        .answer { margin-left: 16px; font-weight: bold; color: #000; }
        .refs { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; }
        .refs h3 { font-size: 10pt; margin-bottom: 6px; }
        .citation { font-size: 8pt; color: #555; margin-bottom: 3px; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
          <div class="credit">AI Generated S2C Lesson</div>
          <div class="title">${lesson.title}</div>
          ${lesson.hashtags?.length ? `<div class="hashtags">${lesson.hashtags.join(' ')}</div>` : ''}
        </div>
        ${hunksHtml}
        <div class="refs">
          <h3>References</h3>
          ${citationsHtml}
        </div>
      </div>
    </body>
    </html>
  `

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: 'Letter',
    margin: { top: '1in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width: 100%; font-size: 8pt; text-align: center; padding: 0 0.75in; font-family: Arial, sans-serif;">
        <div>Key: <span style="color:#15803d;font-weight:bold;">KNOWN</span> | <span style="color:#f97316;font-weight:bold;">SEMI-OPEN</span> | <span style="color:#7e22ce;font-weight:bold;">MATH</span> | <span style="color:#2563eb;font-weight:bold;">PRIOR KNOWLEDGE</span> | <span style="color:#db2777;font-weight:bold;">OPEN</span> | <span style="color:#dc2626;font-weight:bold;">VAKT</span></div>
        <div style="color:#888;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>
    `,
  })

  await browser.close()

  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${lesson.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
    },
  })
}
