import { getLesson } from '@/lib/lessonStore'
import { auth } from '@clerk/nextjs/server'
import { getUserUsage, incrementPrints, MONTHLY_LIMIT } from '@/lib/usageStore'
import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import type { QuestionType } from '@/lib/types'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) redirect('/')

  const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'
  const { userId } = await auth()

  if (userId && userId !== ADMIN_USER_ID) {
    const usage = await getUserUsage(userId)
    if (usage.isSubscribed && usage.lessonsThisMonth + usage.printsThisMonth >= MONTHLY_LIMIT) redirect(`/lessons/${id}`)
    await incrementPrints(userId)
  }

  const logoPath = path.join(process.cwd(), 'public', 'word_up_clean.jpeg')
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : null

  const hunksHtml = lesson.hunks.map(hunk => {
    const questionsHtml = hunk.questions.map(q => `
      <div class="question">
        <div style="color:${QUESTION_COLORS[q.type]};font-weight:bold;">${q.question}</div>
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

  const footerKey = Object.entries(QUESTION_COLORS)
    .map(([type, color]) => `<span style="color:${color};font-weight:bold;">${type}</span>`)
    .join(' &nbsp;|&nbsp; ')

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{lesson.title}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e1e1e; padding: 1in 0.75in 0.75in; }
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
          .footer-key { font-size: 8pt; text-align: center; margin-top: 24px; padding-top: 8px; border-top: 1px solid #eee; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
            @page { margin: 1in 0.75in 0.75in; }
          }
        ` }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          window.onload = function(){
            setTimeout(function(){
              document.getElementById('preparing').style.display = 'none';
              window.print();
            }, 800);
          }
        ` }} />
        <div id="preparing" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, fontSize: '16pt', color: '#1e40af', fontFamily: 'Arial, sans-serif'
        }}>
          Preparing your lesson for printing…
        </div>
        <div className="header" style={{ textAlign: 'center', marginBottom: 16 }}>
          {logoBase64 && <img src={logoBase64} style={{ width: 140, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} alt="Word Up Logo" />}
          <div style={{ fontSize: '9pt', color: '#666', marginBottom: 4 }}>AI Generated S2C Lesson</div>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: 4 }}>{lesson.title}</div>
          {lesson.hashtags?.length ? <div style={{ fontSize: '8pt', color: '#3b82f6', marginBottom: 16 }}>{lesson.hashtags.join(' ')}</div> : null}
        </div>
        <div dangerouslySetInnerHTML={{ __html: hunksHtml }} />
        <div className="refs" style={{ marginTop: 16, borderTop: '1px solid #ccc', paddingTop: 8 }}>
          <h3 style={{ fontSize: '10pt', marginBottom: 6 }}>References</h3>
          <div dangerouslySetInnerHTML={{ __html: citationsHtml }} />
        </div>
        <div className="footer-key" dangerouslySetInnerHTML={{ __html: `Key: ${footerKey}` }} />
      </body>
    </html>
  )
}
