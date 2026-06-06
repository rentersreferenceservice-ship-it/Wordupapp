import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSessionResponses, getStudentAccuracyHistory } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'
import { Document, Page, View, Text, Link, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

export const dynamic = 'force-dynamic'

const QUESTION_COLORS: Record<string, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

const QUESTION_LABELS: Record<string, string> = {
  KNOWN: 'Known', 'SEMI-OPEN': 'Semi-Open', 'PRIOR KNOWLEDGE': 'Prior Knowledge',
  MATH: 'Math', VAKT: 'VAKT', OPEN: 'Open', KEYWORD: 'Spelling',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#111', padding: '0.65in' },
  label: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  section: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  hunkBox: { marginBottom: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8 },
  hunkTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', marginBottom: 6 },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  kwChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  qRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'flex-start' },
  qBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', borderWidth: 1.5, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5 },
  writeLine: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginTop: 5, marginBottom: 4, height: 14 },
  footer: { position: 'absolute', bottom: '0.4in', left: '0.65in', right: '0.65in', textAlign: 'center', fontSize: 7, color: '#aaa' },
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

    const body = await req.json()
    const toRaw: unknown = body.to
    const to: string[] = Array.isArray(toRaw) ? toRaw : (typeof toRaw === 'string' ? [toRaw] : [])
    if (to.length === 0 || to.some(e => !e.includes('@'))) return Response.json({ error: 'Invalid recipient email' }, { status: 400 })

    const { data: session } = await getSupabase()
      .from('sessions').select('*').eq('id', sessionId).eq('practitioner_id', userId).single()
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

    const { data: student } = await getSupabase()
      .from('students').select('name, age_group').eq('id', session.student_id).single()

    const crpRow = session.crp_id
      ? await getSupabase().from('crps').select('name, color').eq('id', session.crp_id).single().then(r => r.data)
      : null

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
    const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

    const responses = await getSessionResponses(sessionId)

    // Stats
    const keywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
    const known = responses.filter(r => r.questionType === 'KNOWN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
    const sentenceLetters = responses
      .filter(r => r.spellerSentence && r.spellerSentence.trim())
      .reduce((s, r) => s + (r.spellerSentence ?? '').replace(/\s/g, '').length, 0)
    const writingLetters = responses
      .filter(r => r.questionType === 'WRITING_PROMPT' && r.capturedAnswer && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
      .reduce((s, r) => s + (r.capturedAnswer ?? '').replace(/\s/g, '').length, 0)
    const totalLetters =
      keywords.reduce((s, k) => s + ((k.keyword ?? k.expectedAnswer ?? '').replace(/\s/g, '').length), 0) +
      known.reduce((s, q) => s + (q.expectedAnswer ?? '').split('/').reduce((a, x) => a + x.trim().replace(/\s/g, '').length, 0), 0) +
      sentenceLetters +
      writingLetters
    const totalMisspokes = responses
      .filter(r => r.hunkNumber != null && r.hunkNumber > 0 && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIPPED')
      .reduce((s, r) => s + (r.misspokeCount ?? 0), 0)
    const totalPokes = totalLetters + totalMisspokes
    const accuracy = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : null
    const hasHunkResponses = responses.some(r => r.hunkNumber != null && r.hunkNumber > 0)

    const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
    const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
    const sessionVideoRecord = responses.find(r => r.questionType === 'SESSION_VIDEO')
    const sessionInvoiceRecord = responses.find(r => r.questionType === 'SESSION_INVOICE')

    const videoUrl = sessionVideoRecord?.capturedAnswer ?? null
    const ytMatch = videoUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    const ytId = ytMatch?.[1] ?? null
    const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null

    const rawInvoice = sessionInvoiceRecord?.capturedAnswer ?? null
    const invoiceUrl = rawInvoice
      ? rawInvoice.startsWith('/practitioner/invoice/')
        ? `https://worduplessongenerator.com/invoice/${rawInvoice.split('/').pop()}`
        : rawInvoice
      : null

    const sessionDate = new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // Accuracy history chart via QuickChart
    let chartBase64: string | null = null
    try {
      const history = await getStudentAccuracyHistory(session.student_id, userId)
      if (history.length >= 2) {
        const labels = history.map(s => new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        const hasReg = history.some(s => s.regulationArrival || s.regulationDeparture)
        const chartConfig = {
          type: 'line',
          data: {
            labels,
            datasets: [
              // Accuracy line — lives in 0-100 zone
              {
                label: 'Accuracy',
                data: history.map(s => s.accuracy),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.08)',
                fill: true,
                pointBackgroundColor: '#2563eb',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3,
                order: 3,
              },
              // Arrived dots — fixed in top lane (112), color encodes state
              ...(hasReg ? [{
                label: 'Arrived',
                data: history.map(s => s.regulationArrival ? 112 : null),
                pointBackgroundColor: history.map(s =>
                  s.regulationArrival === 'regulated' ? '#16a34a' : '#ca8a04'
                ),
                borderWidth: 0,
                pointRadius: 5,
                spanGaps: false,
                order: 1,
              }] : []),
              // Departed dots — fixed in bottom lane (-12), color encodes state
              ...(hasReg ? [{
                label: 'Departed',
                data: history.map(s => s.regulationDeparture ? -12 : null),
                pointBackgroundColor: history.map(s =>
                  s.regulationDeparture === 'regulated' ? '#16a34a' : '#ca8a04'
                ),
                borderWidth: 0,
                pointRadius: 5,
                spanGaps: false,
                order: 2,
              }] : []),
            ],
          },
          options: {
            scales: {
              y: {
                min: hasReg ? -20 : 0,
                max: hasReg ? 120 : 100,
                ticks: {
                  callback: "function(v){if(v>=0&&v<=100)return v+'%';return ''}",
                  ...(hasReg ? { values: [0, 25, 50, 75, 100] } : {}),
                },
              },
              x: { ticks: { maxTicksLimit: 8 } },
            },
            plugins: {
              legend: { display: true, labels: { boxWidth: 12, font: { size: 10 }, filter: "function(i){return i.text!=='Arrived'&&i.text!=='Departed'}" } },
              annotation: hasReg ? {
                annotations: {
                  topBand: { type: 'box', yMin: 104, yMax: 121, backgroundColor: 'rgba(240,253,244,0.8)', borderWidth: 0 },
                  bottomBand: { type: 'box', yMin: -21, yMax: -4, backgroundColor: 'rgba(254,252,232,0.8)', borderWidth: 0 },
                },
              } : {},
            },
          },
        }
        const qcRes = await fetch('https://quickchart.io/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chart: chartConfig, width: 500, height: hasReg ? 220 : 200, version: 3, backgroundColor: 'white' }),
        })
        if (qcRes.ok) {
          chartBase64 = Buffer.from(await qcRes.arrayBuffer()).toString('base64')
        }
      }
    } catch {
      // chart is optional — continue without it
    }

    const byHunk: Record<number, typeof responses> = {}
    for (const r of responses) {
      if (!r.hunkNumber || r.hunkNumber <= 0) continue
      if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
      byHunk[r.hunkNumber].push(r)
    }

    // Build PDF
    const doc = React.createElement(Document, {},
      React.createElement(Page, { style: s.page },

        // Header
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#111' } },
          React.createElement(View, {},
            React.createElement(Text, { style: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 } }, 'Session Transcript'),
            React.createElement(Text, { style: { fontSize: 10, color: '#555' } }, session.lesson_title),
            React.createElement(Text, { style: { fontSize: 9, color: '#888', marginTop: 2 } }, `Sent by ${practitionerName}`),
          ),
          React.createElement(View, { style: { alignItems: 'flex-end' } },
            React.createElement(Text, { style: { fontSize: 14, fontFamily: 'Helvetica-Bold' } }, student?.name ?? ''),
            React.createElement(Text, { style: { fontSize: 9, color: '#555', marginTop: 2 } }, student?.age_group ?? ''),
            React.createElement(Text, { style: { fontSize: 9, color: '#555' } }, sessionDate),
          ),
        ),

        // CRP banner
        ...(crpRow ? [
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, padding: 8, borderRadius: 4, backgroundColor: crpRow.color + '1a', borderWidth: 1.5, borderColor: crpRow.color } },
            React.createElement(View, { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: crpRow.color } }),
            React.createElement(View, {},
              React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase' } }, 'Communication Regulation Partner'),
              React.createElement(Text, { style: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: crpRow.color } }, crpRow.name),
            ),
          ),
        ] : []),

        // Student state
        ...(sessionStateRecord?.capturedAnswer ? [
          React.createElement(View, { style: s.section },
            React.createElement(Text, { style: s.label }, 'Student State'),
            React.createElement(Text, { style: { fontSize: 9 } }, sessionStateRecord.capturedAnswer),
          ),
        ] : []),

        // Notes
        ...(sessionNotesRecord?.capturedAnswer ? [
          React.createElement(View, { style: s.section },
            React.createElement(Text, { style: s.label }, 'Session Notes'),
            React.createElement(Text, { style: { fontSize: 9, color: '#333' } }, sessionNotesRecord.capturedAnswer),
          ),
        ] : []),

        // Video
        ...(videoUrl ? [
          React.createElement(View, { style: s.section },
            React.createElement(Text, { style: s.label }, 'Session Video'),
            ytThumb
              ? React.createElement(Link, { src: videoUrl },
                  React.createElement(Image, { src: ytThumb, style: { width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4, marginTop: 4 } })
                )
              : React.createElement(Link, { src: videoUrl, style: { fontSize: 9, color: '#2563eb' } }, videoUrl),
          ),
        ] : []),

        // Invoice
        ...(invoiceUrl ? [
          React.createElement(View, { style: s.section },
            React.createElement(Text, { style: s.label }, 'Invoice'),
            React.createElement(Link, { src: invoiceUrl, style: { fontSize: 9, color: '#2563eb' } }, 'View Invoice →'),
          ),
        ] : []),

        // Stats
        ...(hasHunkResponses ? [
          React.createElement(View, { style: { flexDirection: 'row', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' } },
            React.createElement(View, { style: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 8, flex: 1, alignItems: 'center' } },
              React.createElement(Text, { style: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2563eb' } }, String(totalLetters)),
              React.createElement(Text, { style: { fontSize: 7, color: '#3b82f6', fontFamily: 'Helvetica-Bold' } }, 'Letters to Poke'),
            ),
            React.createElement(View, { style: { backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, flex: 1, alignItems: 'center' } },
              React.createElement(Text, { style: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#dc2626' } }, String(totalMisspokes)),
              React.createElement(Text, { style: { fontSize: 7, color: '#ef4444', fontFamily: 'Helvetica-Bold' } }, 'Misspokes'),
            ),
            React.createElement(View, { style: { backgroundColor: '#f0fdf4', borderRadius: 6, padding: 8, flex: 1, alignItems: 'center' } },
              React.createElement(Text, { style: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#15803d' } }, accuracy !== null ? `${accuracy}%` : 'N/A'),
              React.createElement(Text, { style: { fontSize: 7, color: '#16a34a', fontFamily: 'Helvetica-Bold' } }, 'Accuracy'),
            ),
          ),
        ] : []),

        // Accuracy history chart
        ...(chartBase64 ? [
          React.createElement(View, { style: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' } },
            React.createElement(Text, { style: s.label }, 'Accuracy History'),
            React.createElement(Image, { src: `data:image/png;base64,${chartBase64}`, style: { width: '100%', marginTop: 4 } }),
          ),
        ] : []),

        // Per-hunk
        ...Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
          const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED')
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD' && r.questionType !== 'WRITING_PROMPT' && r.questionType !== 'HUNK_SKIPPED' && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIP')
          const writingRecord = items.find(r => r.questionType === 'WRITING_PROMPT' && r.capturedAnswer && r.capturedAnswer !== 'SKIPPED')
          if (hunkKeywords.length === 0 && hunkQuestions.length === 0 && !writingRecord) return null

          return React.createElement(View, { key: hunkNum, style: s.hunkBox },
            React.createElement(Text, { style: s.hunkTitle }, `Hunk ${hunkNum}`),

            hunkKeywords.length > 0 ? React.createElement(View, { style: s.kwRow },
              ...hunkKeywords.map((k, i) => {
                const miss = k.misspokeCount ?? 0
                const letters = (k.keyword ?? '').replace(/\s/g, '').length
                return React.createElement(View, { key: i, style: { ...s.kwChip, borderColor: miss > 0 ? '#fecaca' : '#bbf7d0', backgroundColor: miss > 0 ? '#fef2f2' : '#f0fdf4' } },
                  React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: miss > 0 ? '#dc2626' : '#15803d' } }, k.keyword ?? ''),
                  React.createElement(Text, { style: { fontSize: 7, color: '#888' } }, ` ${letters}L`),
                  miss > 0 ? React.createElement(View, { style: { backgroundColor: '#ef4444', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 } },
                    React.createElement(Text, { style: { fontSize: 7, color: '#fff', fontFamily: 'Helvetica-Bold' } }, `${miss} ✗`)
                  ) : React.createElement(Text, { style: { fontSize: 7, color: '#15803d', fontFamily: 'Helvetica-Bold' } }, ' ✓'),
                )
              })
            ) : null,

            // Writing response
            ...(writingRecord ? [
              React.createElement(View, { key: 'writing', style: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#fce7f3' } },
                React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ec4899', textTransform: 'uppercase', marginBottom: 3 } }, 'Writing Prompt'),
                writingRecord.questionText && writingRecord.questionText !== 'Writing Prompt'
                  ? React.createElement(Text, { style: { fontSize: 8, color: '#db2777', fontStyle: 'italic', marginBottom: 3 } }, writingRecord.questionText)
                  : null,
                writingRecord.capturedAnswer
                  ? React.createElement(Text, { style: { fontSize: 9, color: '#1f2937' } }, writingRecord.capturedAnswer)
                  : null,
                (writingRecord.misspokeCount ?? 0) > 0
                  ? React.createElement(Text, { style: { fontSize: 8, color: '#dc2626', marginTop: 2 } }, `${writingRecord.misspokeCount} ✗`)
                  : null,
              )
            ] : []),

            ...hunkQuestions.map((q, i) => {
              const color = QUESTION_COLORS[q.questionType] ?? '#555'
              const label = QUESTION_LABELS[q.questionType] ?? q.questionType
              const notAsked = q.capturedAnswer === 'NOT_ASKED'
              const skipped = q.capturedAnswer === 'SKIP'
              const completed = q.capturedAnswer === 'COMPLETED'
              const isMath = q.questionType === 'MATH'
              const hasTextAnswer = q.capturedAnswer && !notAsked && !skipped && !completed && !isMath
              const isOpen = q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE'
              const miss = q.misspokeCount ?? 0

              let answerText = ''
              if (completed) answerText = '✓ Activity completed'
              else if (isMath) {
                if (q.capturedAnswer === 'correct') answerText = '✓ Correct'
                else if (q.capturedAnswer === 'incorrect') answerText = '✗ Incorrect'
                else answerText = q.expectedAnswer || ''
              } else if (hasTextAnswer) answerText = `Response: ${q.capturedAnswer}`
              else if (q.expectedAnswer) answerText = q.expectedAnswer

              return React.createElement(View, { key: i },
                React.createElement(View, { style: s.qRow },
                  React.createElement(Text, { style: { ...s.qBadge, color, borderColor: color } }, label),
                  React.createElement(Text, { style: { flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold' } },
                    React.createElement(Text, { style: { color: notAsked ? '#aaa' : color } }, q.questionText),
                    answerText ? React.createElement(Text, { style: { color: '#1f2937', fontSize: 9 } }, `\n→ ${answerText}`) : null,
                    miss > 0 && !notAsked ? React.createElement(Text, { style: { color: '#dc2626', fontSize: 8 } }, `\n${miss} ✗`) : null,
                  ),
                ),
              )
            }),
          )
        }),

        React.createElement(Text, { style: s.footer }, 'Word Up S2C · worduplessongenerator.com'),
      )
    )

    const pdfBuffer = await renderToBuffer(doc) as unknown as Buffer
    const filename = `transcript-${(student?.name ?? 'student').replace(/[^a-zA-Z0-9]/g, '-')}-${session.session_date}.pdf`

    // Send email with PDF attached
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'Word Up <noreply@worduplessongenerator.com>',
      replyTo: practitionerEmail || undefined,
      to,
      bcc: 'Wordups2c@gmail.com',
      subject: `Session Transcript — ${student?.name ?? 'Student'} — ${sessionDate}`,
      html: `
<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#374151">
  <h2 style="margin:0 0 4px 0;font-size:20px">Session Transcript</h2>
  <p style="margin:0 0 2px 0;font-size:15px;font-weight:600">${student?.name ?? 'Student'}</p>
  <p style="margin:0 0 ${crpRow ? '10px' : '16px'} 0;font-size:13px;color:#6b7280">${sessionDate}</p>
  ${crpRow ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 14px;border-radius:8px;background:${crpRow.color}1a;border:2px solid ${crpRow.color}">
    <span style="width:12px;height:12px;border-radius:50%;background:${crpRow.color};display:inline-block;flex-shrink:0"></span>
    <div>
      <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.05em">Communication Regulation Partner</div>
      <div style="font-size:17px;font-weight:700;color:${crpRow.color}">${crpRow.name}</div>
    </div>
  </div>` : ''}
  ${hasHunkResponses ? `
  <div style="display:flex;gap:10px;margin-bottom:18px">
    <div style="flex:1;background:#eff6ff;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#2563eb">${totalLetters}</div>
      <div style="font-size:11px;font-weight:600;color:#3b82f6;text-transform:uppercase">Letters to Poke</div>
    </div>
    <div style="flex:1;background:#fef2f2;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#dc2626">${totalMisspokes}</div>
      <div style="font-size:11px;font-weight:600;color:#ef4444;text-transform:uppercase">Misspokes</div>
    </div>
    <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#15803d">${accuracy !== null ? accuracy + '%' : 'N/A'}</div>
      <div style="font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase">Accuracy</div>
    </div>
  </div>` : ''}
  ${chartBase64 ? `
  <div style="margin-bottom:18px">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Accuracy History</p>
    <img src="data:image/png;base64,${chartBase64}" alt="Accuracy chart" style="width:100%;max-width:500px;border-radius:8px;display:block" />
  </div>` : ''}
  ${videoUrl ? `
  <div style="margin-bottom:18px">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Session Video</p>
    ${ytThumb
      ? `<a href="${videoUrl}" target="_blank" style="display:block"><img src="${ytThumb}" alt="Session video" style="width:100%;max-width:480px;border-radius:8px;display:block" /></a>`
      : `<a href="${videoUrl}" style="color:#2563eb;font-size:13px">${videoUrl}</a>`
    }
  </div>` : ''}
  ${invoiceUrl ? `
  <div style="margin-bottom:18px">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Invoice</p>
    <a href="${invoiceUrl}" target="_blank" style="display:inline-block;background:#1e3a5f;color:white;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px">View Invoice →</a>
  </div>` : ''}
  <p style="margin:0 0 6px 0;color:#374151">Please find the full session transcript attached as a PDF.</p>
  <p style="margin:0;font-size:12px;color:#9ca3af">Sent by ${practitionerName} via Word Up S2C · worduplessongenerator.com</p>
</div>`,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer).toString('base64'),
        },
      ],
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return Response.json({ error: resendError.message }, { status: 500 })
    }

    console.log('Resend accepted:', resendData?.id, '→ to:', to)
    return Response.json({ ok: true, messageId: resendData?.id })
  } catch (e) {
    console.error('Email route error:', e)
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
