import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { Document, Page, View, Text, StyleSheet, renderToBuffer, Svg, Path, Circle, Line as SvgLine, Image as PdfImage } from '@react-pdf/renderer'
import React from 'react'
import { getStudentAccuracyHistory } from '@/lib/practitionerStore'
import type { SessionAccuracy } from '@/lib/practitionerStore'
import { getLesson } from '@/lib/lessonStore'
import { generateQRDataUrl } from '@/lib/qrcode'

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
  KNOWN: 'Known',
  'SEMI-OPEN': 'Semi-Open',
  'PRIOR KNOWLEDGE': 'Prior Knowledge',
  MATH: 'Math',
  VAKT: 'VAKT',
  OPEN: 'Open',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#111', padding: '0.65in' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#111' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#555' },
  headerRight: { alignItems: 'flex-end', fontSize: 9, color: '#555' },
  section: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  label: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 7, color: '#555' },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  stateTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#4338ca', borderWidth: 1.5, borderColor: '#6366f1', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  hunkBox: { marginBottom: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8 },
  hunkTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', marginBottom: 6 },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  kwChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  kwWord: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  kwMeta: { fontSize: 7, color: '#888' },
  kwMiss: { fontSize: 7, color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  qRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'flex-start' },
  qBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', borderWidth: 1.5, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5 },
  qText: { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  qAnswer: { fontSize: 8, color: '#555', marginTop: 1 },
  qMiss: { fontSize: 8, color: '#dc2626', fontFamily: 'Helvetica-Bold', marginTop: 1 },
  writeLine: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginTop: 5, marginBottom: 4, height: 14 },
  footer: { position: 'absolute', bottom: '0.4in', left: '0.65in', right: '0.65in', textAlign: 'center', fontSize: 7, color: '#aaa' },
})

function renderPdfAccuracyChart(data: SessionAccuracy[], currentSessionId: string) {
  if (data.length < 2) return []
  const W = 460, H = 80
  const padL = 28, padR = 8, padT = 6, padB = 18
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * plotW,
    y: padT + (1 - d.accuracy / 100) * plotH,
    isCurrent: d.sessionId === currentSessionId,
  }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const step = Math.max(1, Math.floor(data.length / 5))
  const xIdxs = [...new Set([0, ...[1,2,3,4].map(n => n * step), data.length - 1])].filter(i => i < data.length)

  return [
    React.createElement(View, { style: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' } },
      React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', marginBottom: 4 } }, 'Accuracy — Past 12 Months'),
      React.createElement(Svg, { viewBox: `0 0 ${W} ${H}`, style: { width: '100%', height: H } },
        // Grid lines
        ...[0, 50, 100].map(pct => {
          const y = (padT + (1 - pct / 100) * plotH).toFixed(1)
          return React.createElement(SvgLine, { key: `g${pct}`, x1: String(padL), y1: y, x2: String(W - padR), y2: y, stroke: '#eeeeee', strokeWidth: '1' })
        }),
        // Line
        React.createElement(Path, { d: pathD, fill: 'none', stroke: '#2563eb', strokeWidth: '1.5' }),
        // Dots
        ...pts.map((p, i) => React.createElement(Circle, { key: `d${i}`, cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: p.isCurrent ? '4' : '2.5', fill: p.isCurrent ? '#1d4ed8' : '#2563eb' })),
        // X-axis date labels
        ...xIdxs.map(i => {
          const d = data[i]
          const label = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return React.createElement(SvgLine, { key: `l${i}`, x1: pts[i].x.toFixed(1), y1: String(H - padB + 2), x2: pts[i].x.toFixed(1), y2: String(H - padB + 2), stroke: 'none', strokeWidth: '0' })
        }),
      ),
      // X-axis labels as a flex row below SVG (react-pdf SVG text is limited)
      React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padL, marginTop: 2 } },
        ...xIdxs.map(i => {
          const d = data[i]
          const label = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return React.createElement(Text, { key: `xl${i}`, style: { fontSize: 6, color: '#aaaaaa' } }, label)
        }),
      ),
    ),
  ]
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })


  const { data: session } = await getSupabase()
    .from('sessions').select('*').eq('id', sessionId).eq('practitioner_id', userId).single()
  if (!session) return new Response('Not found', { status: 404 })

  const { data: studentData } = await getSupabase()
    .from('students').select('name, age_group').eq('id', session.student_id).single()

  const [responses, accuracyHistory, lesson] = await Promise.all([
    getSessionResponses(sessionId),
    getStudentAccuracyHistory(session.student_id, userId),
    session.lesson_id ? getLesson(session.lesson_id) : Promise.resolve(null),
  ])

  // Build QR code data URLs for VAKT questions
  const qrMap: Record<string, string> = {}
  if (lesson) {
    await Promise.all(
      lesson.hunks.flatMap(h =>
        h.questions.map(async (q, qi) => {
          if (q.type === 'VAKT' && q.youtubeQuery) {
            qrMap[`${h.number}-${qi}`] = await generateQRDataUrl(q.youtubeVideoId, q.youtubeQuery)
          }
        })
      )
    )
  }

  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
  const sessionVideoRecord = responses.find(r => r.questionType === 'SESSION_VIDEO')
  const sessionInvoiceRecord = responses.find(r => r.questionType === 'SESSION_INVOICE')

  const byHunk: Record<number, typeof responses> = {}
  for (const r of responses) {
    if (r.hunkNumber == null || r.hunkNumber <= 0) continue
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const spellKeywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
  const spellKnown = responses.filter(r => r.questionType === 'KNOWN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const totalLetters =
    spellKeywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
    spellKnown.reduce((sum, q) => sum + (q.expectedAnswer ?? '').split('/').reduce((s, a) => s + a.trim().replace(/\s/g, '').length, 0), 0)
  const totalMisspokes = [...spellKeywords, ...spellKnown].reduce((sum, r) => sum + (r.misspokeCount ?? 0), 0)
  const totalPokes = totalLetters + totalMisspokes
  const correctPct = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : 0
  const misspokePct = totalPokes > 0 ? 100 - correctPct : 0
  const dateStr = new Date(session.session_date + 'T00:00:00').toLocaleDateString()

  const mathAsked = responses.filter(r => r.questionType === 'MATH' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const mathAnswered = mathAsked.filter(r => r.capturedAnswer === 'correct' || r.capturedAnswer === 'incorrect')
  const mathCorrect = mathAnswered.filter(r => r.capturedAnswer === 'correct').length
  const openAsked = responses.filter(r => (r.questionType === 'OPEN' || r.questionType === 'PRIOR KNOWLEDGE') && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const openAnsweredItems = openAsked.filter(r => r.capturedAnswer && r.capturedAnswer.trim() !== '')
  const openAnswered = openAnsweredItems.length
  const openLetters = openAnsweredItems.reduce((sum, r) => sum + (r.capturedAnswer ?? '').replace(/\s/g, '').length, 0)
  const openMisspokes = openAnsweredItems.reduce((sum, r) => sum + (r.misspokeCount ?? 0), 0)
  const openPokes = openLetters + openMisspokes

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'LETTER', style: s.page },

      // Header
      React.createElement(View, { style: s.header },
        React.createElement(View, {},
          React.createElement(Text, { style: s.title }, 'Word Up S2C — Session Transcript'),
          React.createElement(Text, { style: s.subtitle }, session.lesson_title),
        ),
        React.createElement(View, { style: s.headerRight },
          React.createElement(Text, { style: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 3 } }, studentData?.name ?? ''),
          React.createElement(Text, {}, studentData?.age_group ?? ''),
          React.createElement(Text, {}, dateStr),
        ),
      ),

      // Student State
      ...(sessionStateRecord?.capturedAnswer ? [
        React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: s.label }, 'Student State'),
          React.createElement(View, { style: s.stateRow },
            ...sessionStateRecord.capturedAnswer.split(', ').filter(Boolean).map((st, i) =>
              React.createElement(Text, { key: i, style: s.stateTag }, st)
            )
          ),
        ),
      ] : []),

      // Notes
      ...(sessionNotesRecord?.capturedAnswer ? [
        React.createElement(View, { style: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' } },
          React.createElement(Text, { style: s.label }, 'Session Notes'),
          React.createElement(Text, { style: { fontSize: 9, color: '#333' } }, sessionNotesRecord.capturedAnswer),
        ),
      ] : []),

      // Video & Invoice
      ...((sessionVideoRecord?.capturedAnswer || sessionInvoiceRecord?.capturedAnswer) ? [
        React.createElement(View, { style: { flexDirection: 'row', gap: 24, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' } },
          ...(sessionVideoRecord?.capturedAnswer ? [
            React.createElement(View, {},
              React.createElement(Text, { style: s.label }, 'Session Video'),
              React.createElement(Text, { style: { fontSize: 9, color: '#2563eb' } }, sessionVideoRecord.capturedAnswer),
            ),
          ] : []),
          ...(sessionInvoiceRecord?.capturedAnswer ? [
            React.createElement(View, {},
              React.createElement(Text, { style: s.label }, 'Invoice'),
              React.createElement(Text, { style: { fontSize: 9, color: '#2563eb' } }, sessionInvoiceRecord.capturedAnswer),
            ),
          ] : []),
        ),
      ] : []),

      // Stats
      React.createElement(View, { style: s.statsRow },
        React.createElement(View, { style: { ...s.statBox, backgroundColor: '#eff6ff', borderRadius: 6, padding: 8, flex: 1 } },
          React.createElement(Text, { style: { ...s.statVal, color: '#2563eb' } }, String(totalLetters)),
          React.createElement(Text, { style: { ...s.statLabel, color: '#3b82f6', fontFamily: 'Helvetica-Bold' } }, 'Letters to Poke'),
        ),
        React.createElement(View, { style: { ...s.statBox, backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, flex: 1 } },
          React.createElement(Text, { style: { ...s.statVal, color: '#dc2626' } }, String(totalMisspokes)),
          React.createElement(Text, { style: { ...s.statLabel, color: '#ef4444', fontFamily: 'Helvetica-Bold' } }, 'Misspokes'),
        ),
        React.createElement(View, { style: { ...s.statBox, backgroundColor: '#f0fdf4', borderRadius: 6, padding: 8, flex: 1 } },
          React.createElement(Text, { style: { ...s.statVal, color: '#15803d' } }, `${correctPct}%`),
          React.createElement(Text, { style: { ...s.statLabel, color: '#16a34a', fontFamily: 'Helvetica-Bold' } }, `Accuracy (${misspokePct}% error rate)`),
        ),
        React.createElement(View, { style: { ...s.statBox, backgroundColor: '#f9fafb', borderRadius: 6, padding: 8, flex: 1 } },
          React.createElement(Text, { style: { ...s.statVal, color: '#555' } }, String(totalPokes)),
          React.createElement(Text, { style: { ...s.statLabel, fontFamily: 'Helvetica-Bold' } }, 'Total Pokes'),
        ),
      ),

      // Math + Open secondary stats
      ...(mathAnswered.length > 0 || openAsked.length > 0 ? [
        React.createElement(View, { style: { flexDirection: 'row', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' } },
          ...(mathAnswered.length > 0 ? [React.createElement(View, { style: { ...s.statBox, backgroundColor: '#faf5ff', borderRadius: 6, padding: 6, flex: 1 } },
            React.createElement(Text, { style: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#7e22ce' } }, `${mathCorrect}/${mathAnswered.length}`),
            React.createElement(Text, { style: { ...s.statLabel, color: '#7e22ce', fontFamily: 'Helvetica-Bold' } }, 'Math Correct'),
          )] : []),
          ...(openAsked.length > 0 ? [React.createElement(View, { style: { ...s.statBox, backgroundColor: '#fdf2f8', borderRadius: 6, padding: 6, flex: 1 } },
            React.createElement(Text, { style: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#db2777' } }, `${openAnswered}/${openAsked.length}`),
            React.createElement(Text, { style: { ...s.statLabel, color: '#db2777', fontFamily: 'Helvetica-Bold' } }, 'Open Responses'),
            ...(openPokes > 0 ? [React.createElement(Text, { style: { fontSize: 6, color: '#db2777', marginTop: 2 } }, `${openLetters}L · ${openMisspokes}✗ · ${openPokes} pokes`)] : []),
          )] : []),
        ),
      ] : []),

      // Accuracy chart
      ...renderPdfAccuracyChart(accuracyHistory, sessionId),

      // Per-hunk
      ...Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
        const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED')
        const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD' && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIP')
        if (hunkKeywords.length === 0 && hunkQuestions.length === 0) return null

        return React.createElement(View, { key: hunkNum, style: s.hunkBox },
          React.createElement(Text, { style: s.hunkTitle }, `Hunk ${hunkNum}`),

          // Keywords
          hunkKeywords.length > 0 ? React.createElement(View, { style: s.kwRow },
            ...hunkKeywords.map((k, i) => {
              const skipped = k.capturedAnswer === 'SKIPPED'
              const miss = k.misspokeCount ?? 0
              const letters = (k.keyword ?? '').replace(/\s/g, '').length
              return React.createElement(View, { key: i, style: { ...s.kwChip, borderColor: skipped ? '#ccc' : miss > 0 ? '#fecaca' : '#bbf7d0', backgroundColor: skipped ? '#f9fafb' : miss > 0 ? '#fef2f2' : '#f0fdf4', opacity: skipped ? 0.6 : 1 } },
                React.createElement(Text, { style: { ...s.kwWord, color: skipped ? '#999' : miss > 0 ? '#dc2626' : '#15803d', textDecoration: skipped ? 'line-through' : 'none' } }, k.keyword ?? ''),
                React.createElement(Text, { style: s.kwMeta }, ` ${letters}L`),
                miss > 0 ? React.createElement(View, { style: { backgroundColor: '#ef4444', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 } },
                  React.createElement(Text, { style: { fontSize: 7, color: '#fff', fontFamily: 'Helvetica-Bold' } }, `${miss} ✗`)
                ) : null,
                miss === 0 && !skipped ? React.createElement(Text, { style: { fontSize: 7, color: '#15803d' } }, ' ✓') : null,
              )
            })
          ) : null,

          // Questions
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
            const isVakt = q.questionType === 'VAKT'
            const qrDataUrl = isVakt ? qrMap[`${q.hunkNumber}-${i}`] : undefined

            let answerText = ''
            if (notAsked) answerText = 'Not asked this session'
            else if (completed) answerText = '✓ Activity completed'
            else if (skipped) answerText = 'Skipped'
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
                qrDataUrl ? React.createElement(View, { style: { alignItems: 'center', width: 56 } },
                  React.createElement(PdfImage, { src: qrDataUrl, style: { width: 52, height: 52 } }),
                  React.createElement(Text, { style: { fontSize: 6, color: '#aaa', marginTop: 1 } }, 'YouTube'),
                ) : null,
              ),
              !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
              isOpen && !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
              isOpen && !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
              isOpen && !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
            )
          }),
        )
      }),

      // Footer
      React.createElement(Text, { style: s.footer }, 'Word Up S2C Lesson Generator — worduplessongenerator.com'),
    )
  )

  const buffer = await renderToBuffer(doc) as unknown as ArrayBuffer
  const filename = `transcript-${studentData?.name ?? 'student'}-${session.session_date}.pdf`
    .replace(/[^a-zA-Z0-9\-_.]/g, '-')

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
