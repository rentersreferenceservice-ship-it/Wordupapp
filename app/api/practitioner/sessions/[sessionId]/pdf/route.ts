import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPractitionerSubscription, getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const sub = await getPractitionerSubscription(userId)
  if (!sub) return new Response('Forbidden', { status: 403 })

  const { data: session } = await getSupabase()
    .from('sessions').select('*').eq('id', sessionId).eq('practitioner_id', userId).single()
  if (!session) return new Response('Not found', { status: 404 })

  const { data: studentData } = await getSupabase()
    .from('students').select('name, age_group').eq('id', session.student_id).single()

  const responses = await getSessionResponses(sessionId)

  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')

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

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'LETTER', style: s.page },

      // Header
      React.createElement(View, { style: s.header },
        React.createElement(View, {},
          React.createElement(Text, { style: s.title }, 'Word Up S2C — Session Transcript'),
          React.createElement(Text, { style: s.subtitle }, session.lesson_title),
        ),
        React.createElement(View, { style: s.headerRight },
          React.createElement(Text, {}, `Student: ${studentData?.name ?? ''}`),
          React.createElement(Text, {}, `Age Group: ${studentData?.age_group ?? ''}`),
          React.createElement(Text, {}, `Date: ${dateStr}`),
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

      // Stats
      React.createElement(View, { style: s.statsRow },
        React.createElement(View, { style: s.statBox },
          React.createElement(Text, { style: { ...s.statVal, color: '#2563eb' } }, String(totalLetters)),
          React.createElement(Text, { style: s.statLabel }, 'Letters to Poke'),
        ),
        React.createElement(View, { style: s.statBox },
          React.createElement(Text, { style: { ...s.statVal, color: '#dc2626' } }, String(totalMisspokes)),
          React.createElement(Text, { style: s.statLabel }, 'Misspokes'),
        ),
        React.createElement(View, { style: s.statBox },
          React.createElement(Text, { style: { ...s.statVal, color: '#15803d' } }, `${correctPct}%`),
          React.createElement(Text, { style: s.statLabel }, `Accuracy (${misspokePct}% error rate)`),
        ),
        React.createElement(View, { style: s.statBox },
          React.createElement(Text, { style: { ...s.statVal, color: '#555' } }, String(totalPokes)),
          React.createElement(Text, { style: s.statLabel }, 'Total Pokes'),
        ),
      ),

      // Per-hunk
      ...Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
        const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD')
        const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD')

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
                miss > 0 ? React.createElement(Text, { style: s.kwMiss }, ` ${'✗'.repeat(miss)}`) : null,
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
            const hasTextAnswer = q.capturedAnswer && !notAsked && !skipped && !completed
            const isOpen = q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE'
            const miss = q.misspokeCount ?? 0

            let answerText = ''
            if (notAsked) answerText = 'Not asked this session'
            else if (completed) answerText = '✓ Activity completed'
            else if (skipped) answerText = 'Skipped'
            else if (hasTextAnswer) answerText = `Response: ${q.capturedAnswer}`
            else if (q.expectedAnswer) answerText = `Expected: ${q.expectedAnswer}`

            return React.createElement(View, { key: i },
              React.createElement(View, { style: s.qRow },
                React.createElement(Text, { style: { ...s.qBadge, color, borderColor: color } }, label),
                React.createElement(View, { style: { flex: 1 } },
                  React.createElement(Text, { style: { ...s.qText, color: notAsked ? '#aaa' : color } }, q.questionText),
                  answerText ? React.createElement(Text, { style: s.qAnswer }, answerText) : null,
                  miss > 0 && !notAsked ? React.createElement(Text, { style: s.qMiss }, '✗'.repeat(miss)) : null,
                ),
              ),
              !notAsked && !skipped ? React.createElement(View, { style: s.writeLine }) : null,
              isOpen && !notAsked ? React.createElement(View, { style: s.writeLine }) : null,
            )
          }),
        )
      }),

      // Footer
      React.createElement(Text, { style: s.footer }, 'Word Up S2C Lesson Generator — worduplessongenerator.com'),
    )
  )

  const buffer = await renderToBuffer(doc)
  const filename = `transcript-${studentData?.name ?? 'student'}-${session.session_date}.pdf`
    .replace(/[^a-zA-Z0-9\-_.]/g, '-')

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
