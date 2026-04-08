import { NextRequest } from 'next/server'
import { getLesson } from '@/lib/lessonStore'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Footer,
  PageNumber,
  convertInchesToTwip,
} from 'docx'
import type { QuestionType } from '@/lib/types'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: '15803D',
  'SEMI-OPEN': 'EA580C',
  'PRIOR KNOWLEDGE': '2563EB',
  MATH: '7E22CE',
  VAKT: 'DC2626',
  OPEN: 'DB2777',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const children: Paragraph[] = []

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: lesson.title, bold: true, size: 32 })],
      spacing: { after: 80 },
    })
  )

  // "Created by" line
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Created by Word Up Lesson Generator', size: 18, color: '9CA3AF' })],
      spacing: { after: 40 },
    })
  )

  // Hashtags
  if (lesson.hashtags?.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: lesson.hashtags.join(' '), size: 18, color: '3B82F6' })],
        spacing: { after: 240 },
      })
    )
  }

  // Hunks
  for (const hunk of lesson.hunks) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: hunk.text, size: 28 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120 },
      })
    )

    for (const q of hunk.questions) {
      const color = QUESTION_COLORS[q.type]
      children.push(
        new Paragraph({
          children: [new TextRun({ text: q.question, color, size: 28, bold: true })],
        })
      )
      children.push(
        new Paragraph({
          children: [new TextRun({ text: q.answer, size: 28, color: '000000' })],
          spacing: { after: 80 },
        })
      )
    }

    children.push(new Paragraph({ text: '' }))
  }

  // References
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'References', bold: true, size: 24 })],
      spacing: { before: 240, after: 80 },
    })
  )
  lesson.citations.forEach((c, i) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${c}`, size: 24, color: '374151' })],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { after: 60 },
      })
    )
  })

  // Footer with colored key + page number
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Question Type Key: ', size: 16, color: '6B7280' }),
                  new TextRun({ text: 'KNOWN', size: 16, color: QUESTION_COLORS.KNOWN, bold: true }),
                  new TextRun({ text: ' | ', size: 16, color: '6B7280' }),
                  new TextRun({ text: 'SEMI-OPEN', size: 16, color: QUESTION_COLORS['SEMI-OPEN'], bold: true }),
                  new TextRun({ text: ' | ', size: 16, color: '6B7280' }),
                  new TextRun({ text: 'MATH', size: 16, color: QUESTION_COLORS.MATH, bold: true }),
                  new TextRun({ text: ' | ', size: 16, color: '6B7280' }),
                  new TextRun({ text: 'PRIOR KNOWLEDGE', size: 16, color: QUESTION_COLORS['PRIOR KNOWLEDGE'], bold: true }),
                  new TextRun({ text: ' | ', size: 16, color: '6B7280' }),
                  new TextRun({ text: 'OPEN', size: 16, color: QUESTION_COLORS.OPEN, bold: true }),
                  new TextRun({ text: ' | ', size: 16, color: '6B7280' }),
                  new TextRun({ text: 'VAKT', size: 16, color: QUESTION_COLORS.VAKT, bold: true }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '6B7280' }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${lesson.title.replace(/[^a-z0-9]/gi, '_')}.docx"`,
    },
  })
}
