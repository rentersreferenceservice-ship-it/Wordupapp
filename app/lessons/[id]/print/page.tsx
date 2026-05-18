import { getLesson } from '@/lib/lessonStore'
import { auth } from '@clerk/nextjs/server'
import { getUserUsage, incrementPrints, MONTHLY_LIMIT } from '@/lib/usageStore'
import { redirect } from 'next/navigation'
import { type Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import type { QuestionType } from '@/lib/types'
import { generateQRDataUrl } from '@/lib/qrcode'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const lesson = await getLesson(id)
  return { title: lesson?.title ?? 'Print Lesson' }
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

  const qrMap: Record<string, string> = {}
  await Promise.all(
    lesson.hunks.flatMap(h =>
      h.questions.map(async (q, qi) => {
        if (q.type === 'VAKT' && q.youtubeQuery) {
          qrMap[`${h.number}-${qi}`] = await generateQRDataUrl(q.youtubeVideoId, q.youtubeQuery)
        }
      })
    )
  )

  const hunksHtml = lesson.hunks.map(hunk => {
    const questionsHtml = hunk.questions.map((q, qi) => {
      const qr = q.type === 'VAKT' ? qrMap[`${hunk.number}-${qi}`] : undefined
      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <div style="flex:1;">
              <div style="color:${QUESTION_COLORS[q.type]};font-weight:bold;">${q.question}</div>
              ${q.answer ? `<div style="margin-left:16px;font-weight:bold;color:#000;">${q.answer}</div>` : ''}
            </div>
            ${qr ? `<div style="text-align:center;flex-shrink:0;max-width:90px;"><img src="${qr}" width="72" height="72" alt="YouTube QR"/>${q.youtubeDescription ? `<div style="font-size:6.5pt;color:#444;margin-top:2px;line-height:1.3;">${q.youtubeDescription}</div>` : ''}${q.youtubeDuration && q.youtubeVideoTitle ? `<div style="font-size:6pt;color:#aaa;margin-top:1px;line-height:1.3;">${q.youtubeDuration} — ${q.youtubeVideoTitle}</div>` : ''}</div>` : ''}
          </div>
          <div style="border-bottom:1px solid #bbb;margin-top:5px;"></div>
        </div>
      `
    }).join('')

    return `
      <div style="margin-bottom:16px;">
        ${hunk.imageUrl ? `<img src="${hunk.imageUrl}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
        <p style="margin-bottom:8px;line-height:1.5;">${hunk.text}</p>
        ${questionsHtml}
      </div>
    `
  }).join('')

  const citationsHtml = lesson.citations.map((c, i) => `<p style="font-size:8pt;color:#555;margin-bottom:3px;">${i + 1}. ${c}</p>`).join('')

  const footerKey = Object.entries(QUESTION_COLORS)
    .map(([type, color]) => `<span style="color:${color};font-weight:bold;">${type}</span>`)
    .join(' &nbsp;|&nbsp; ')

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          var s = document.createElement('style');
          s.textContent = '[aria-hidden="true"]{display:none!important;} @page{margin:1in 0.75in 1in 0.75in;} @media print{[aria-hidden="true"]{display:none!important;} }';
          document.head.appendChild(s);
        })();
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
      <div id="print-wrap" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', color: '#1e1e1e', padding: '1in 0.75in 0', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tfoot>
            <tr>
              <td style={{ fontSize: '8pt', textAlign: 'center', borderTop: '1px solid #999', padding: '5px 0 6px' }} dangerouslySetInnerHTML={{ __html: `Key: ${footerKey}` }} />
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {logoBase64 && <img src={logoBase64} style={{ width: 140, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} alt="Word Up Logo" />}
                  <div style={{ fontSize: '9pt', color: '#666', marginBottom: 4 }}>AI Generated S2C Lesson</div>
                  <div style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: 4 }}>{lesson.title}</div>
                  {lesson.hashtags?.length ? <div style={{ fontSize: '8pt', color: '#3b82f6', marginBottom: 16 }}>{lesson.hashtags.join(' ')}</div> : null}
                </div>
                <div dangerouslySetInnerHTML={{ __html: hunksHtml }} />
                <div style={{ marginTop: 16, borderTop: '1px solid #ccc', paddingTop: 8 }}>
                  <h3 style={{ fontSize: '10pt', marginBottom: 6 }}>References</h3>
                  <div dangerouslySetInnerHTML={{ __html: citationsHtml }} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
