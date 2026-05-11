import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'
import { Document, Page, View, Text, Link, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
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

    const { to } = await req.json()
    if (!to || !to.includes('@')) return Response.json({ error: 'Invalid recipient email' }, { status: 400 })

    const { data: session } = await getSupabase()
      .from('sessions').select('*').eq('id', sessionId).eq('practitioner_id', userId).single()
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

    const { data: student } = await getSupabase()
      .from('students').select('name, age_group').eq('id', session.student_id).single()

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
    const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

    const responses = await getSessionResponses(sessionId)

    // Stats
    const keywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
    const known = responses.filter(r => r.questionType === 'KNOWN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
    const totalLetters =
      keywords.reduce((s, k) => s + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
      known.reduce((s, q) => s + (q.expectedAnswer ?? '').split('/').reduce((a, x) => a + x.trim().replace(/\s/g, '').length, 0), 0)
    const totalMisspokes = [...keywords, ...known].reduce((s, r) => s + (r.misspokeCount ?? 0), 0)
    const totalPokes = totalLetters + totalMisspokes
    const accuracy = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : null

    const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
    const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
    const sessionVideoRecord = responses.find(r => r.questionType === 'SESSION_VIDEO')
    const sessionInvoiceRecord = responses.find(r => r.questionType === 'SESSION_INVOICE')

    const sessionDate = new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

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

        // Video & Invoice
        ...((sessionVideoRecord?.capturedAnswer || sessionInvoiceRecord?.capturedAnswer) ? [
          React.createElement(View, { style: { ...s.section, flexDirection: 'row', gap: 24 } },
            ...(sessionVideoRecord?.capturedAnswer ? [
              React.createElement(View, {},
                React.createElement(Text, { style: s.label }, 'Session Video'),
                React.createElement(Link, { src: sessionVideoRecord.capturedAnswer, style: { fontSize: 9, color: '#2563eb' } }, sessionVideoRecord.capturedAnswer),
              ),
            ] : []),
            ...(sessionInvoiceRecord?.capturedAnswer ? [
              React.createElement(View, {},
                React.createElement(Text, { style: s.label }, 'Invoice'),
                React.createElement(Link, { src: sessionInvoiceRecord.capturedAnswer, style: { fontSize: 9, color: '#2563eb' } }, sessionInvoiceRecord.capturedAnswer),
              ),
            ] : []),
          ),
        ] : []),

        // Stats
        ...(accuracy !== null ? [
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
              React.createElement(Text, { style: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#15803d' } }, `${accuracy}%`),
              React.createElement(Text, { style: { fontSize: 7, color: '#16a34a', fontFamily: 'Helvetica-Bold' } }, 'Accuracy'),
            ),
          ),
        ] : []),

        // Per-hunk
        ...Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
          const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED')
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD' && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIP')
          if (hunkKeywords.length === 0 && hunkQuestions.length === 0) return null

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
                !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
                isOpen && !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
                isOpen && !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
                isOpen && !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
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
    const { error: resendError } = await resend.emails.send({
      from: 'Word Up <noreply@worduplessongenerator.com>',
      replyTo: practitionerEmail || undefined,
      to,
      subject: `Session Transcript — ${student?.name ?? 'Student'} — ${sessionDate}`,
      html: `<p style="font-family:system-ui,sans-serif;color:#374151">Please find attached the session transcript for <strong>${student?.name ?? 'your student'}</strong> from ${sessionDate}.</p><p style="font-family:system-ui,sans-serif;font-size:12px;color:#9ca3af">Sent by ${practitionerName} via Word Up S2C · worduplessongenerator.com</p>`,
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

    return Response.json({ ok: true })
  } catch (e) {
    console.error('Email route error:', e)
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
