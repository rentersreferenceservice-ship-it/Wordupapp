import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPractitionerSubscription, getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType } from 'docx'

export const dynamic = 'force-dynamic'

const QUESTION_LABELS: Record<string, string> = {
  KNOWN: 'Known',
  'SEMI-OPEN': 'Semi-Open',
  'PRIOR KNOWLEDGE': 'Prior Knowledge',
  MATH: 'Math',
  VAKT: 'VAKT',
  OPEN: 'Open',
  KEYWORD: 'Spelling',
}

function para(text: string, opts?: { bold?: boolean; size?: number; color?: string; italic?: boolean; spacing?: number }) {
  return new Paragraph({
    spacing: { after: opts?.spacing ?? 80 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        size: opts?.size ?? 22,
        color: opts?.color,
        italics: opts?.italic,
      }),
    ],
  })
}

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
    if (r.hunkNumber == null) continue
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const keywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED')
  const totalLetters = keywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0)
  const totalMisspokes = keywords.reduce((sum, k) => sum + (k.misspokeCount ?? 0), 0)
  const totalPokes = totalLetters + totalMisspokes
  const correctPct = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : 0
  const misspokePct = totalPokes > 0 ? 100 - correctPct : 0
  const dateStr = new Date(session.session_date + 'T00:00:00').toLocaleDateString()

  const children: Paragraph[] = [
    // Title
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'Word Up S2C — Session Transcript', bold: true, size: 36 })],
    }),
    para(`${session.lesson_title}`, { size: 24, color: '555555', spacing: 40 }),
    para(`Student: ${studentData?.name ?? ''}   |   Age Group: ${studentData?.age_group ?? ''}   |   Date: ${dateStr}`, { size: 20, color: '777777', spacing: 160 }),

    // Sensory / Student State
    para('Student State', { bold: true, size: 22, spacing: 40 }),
    para(
      sessionStateRecord?.capturedAnswer
        ? sessionStateRecord.capturedAnswer.split(', ').filter(Boolean).join('  ·  ')
        : 'Not recorded',
      { size: 22, italic: !sessionStateRecord?.capturedAnswer, color: sessionStateRecord?.capturedAnswer ? '111111' : 'aaaaaa', spacing: 80 }
    ),

    // Notes
    para('Session Notes', { bold: true, size: 22, spacing: 40 }),
    para(
      sessionNotesRecord?.capturedAnswer || 'None',
      { size: 22, italic: !sessionNotesRecord?.capturedAnswer, color: sessionNotesRecord?.capturedAnswer ? '111111' : 'aaaaaa', spacing: 160 }
    ),

    // Stats
    para('Session Summary', { bold: true, size: 24, spacing: 60 }),
    para(`Letters to poke: ${totalLetters}   |   Misspokes: ${totalMisspokes}   |   Total pokes: ${totalPokes}   |   Accuracy: ${correctPct}%  (${misspokePct}% error rate)`, { size: 22, spacing: 200 }),
  ]

  // Per-hunk detail
  for (const [hunkNum, items] of Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b))) {
    const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD')
    const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD')

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: `Hunk ${hunkNum}`, bold: true, size: 26, color: '888888' })],
      })
    )

    if (hunkKeywords.length > 0) {
      children.push(para('Spelling Words', { bold: true, size: 20, color: '555555', spacing: 40 }))
      const kwLine = hunkKeywords.map(k => {
        const letters = (k.keyword ?? '').replace(/\s/g, '').length
        const miss = k.misspokeCount ?? 0
        const skipped = k.capturedAnswer === 'SKIPPED'
        return skipped
          ? `${k.keyword} (not asked)`
          : miss > 0
          ? `${k.keyword} [${letters}L, ${miss}✗]`
          : `${k.keyword} [${letters}L ✓]`
      }).join('   ')
      children.push(para(kwLine, { size: 22, spacing: 100 }))
    }

    for (const q of hunkQuestions) {
      const label = QUESTION_LABELS[q.questionType] ?? q.questionType
      const notAsked = q.capturedAnswer === 'NOT_ASKED'
      const completed = q.capturedAnswer === 'COMPLETED'
      let answerText = ''
      if (notAsked) answerText = '(not asked this session)'
      else if (completed) answerText = '✓ Activity completed'
      else if (q.capturedAnswer && q.capturedAnswer !== 'SKIP') answerText = `Response: ${q.capturedAnswer}`

      const isOpen = q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE'

      children.push(
        new Paragraph({
          spacing: { after: isOpen ? 40 : 80 },
          children: [
            new TextRun({ text: `[${label}]  `, bold: true, size: 20, color: '555555' }),
            new TextRun({ text: q.questionText, size: 22, italics: notAsked, color: notAsked ? 'aaaaaa' : '111111' }),
            ...(answerText ? [new TextRun({ text: `  — ${answerText}`, size: 20, color: '666666' })] : []),
            ...(q.misspokeCount && q.misspokeCount > 0 && !notAsked ? [new TextRun({ text: `  ${q.misspokeCount}✗`, size: 20, color: 'dc2626' })] : []),
          ],
        })
      )

      // Blank lines for open questions
      if (isOpen && !notAsked) {
        children.push(
          new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '_'.repeat(80), size: 20, color: 'cccccc' })] }),
          new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '_'.repeat(80), size: 20, color: 'cccccc' })] }),
        )
      }
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Word Up S2C Lesson Generator — worduplessongenerator.com', size: 18, color: 'aaaaaa' })],
    })
  )

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const buffer = await Packer.toBuffer(doc) as unknown as ArrayBuffer
  const filename = `transcript-${studentData?.name ?? 'student'}-${session.session_date}.docx`
    .replace(/[^a-zA-Z0-9\-_.]/g, '-')

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
