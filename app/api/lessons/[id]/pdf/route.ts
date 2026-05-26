import { NextRequest } from 'next/server'
import { getLesson } from '@/lib/lessonStore'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import type { QuestionType } from '@/lib/types'

const QUESTION_COLORS: Record<QuestionType, [number, number, number]> = {
  KNOWN: [21, 128, 61],
  'SEMI-OPEN': [249, 115, 22],
  'PRIOR KNOWLEDGE': [37, 99, 235],
  MATH: [126, 34, 206],
  VAKT: [220, 38, 38],
  OPEN: [219, 39, 119],
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const doc = new PDFDocument({ margin: 72, size: 'LETTER' })
  const chunks: Buffer[] = []
  doc.on('data', chunk => chunks.push(chunk))

  // Logo centered at top
  const logoPath = path.join(process.cwd(), 'public', 'word_up_clean.jpeg')
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, (doc.page.width - 100) / 2, doc.y, { width: 100 })
    doc.y += 110
  }

  // Credit + title
  doc.fontSize(9).font('Helvetica').fillColor([100, 100, 100])
    .text('AI Generated S2C Lesson', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(16).font('Helvetica-Bold').fillColor([0, 0, 0])
    .text(lesson.title, { align: 'center' })
  doc.moveDown(0.3)

  // Hashtags
  if (lesson.hashtags?.length) {
    doc.fontSize(9).font('Helvetica').fillColor([59, 130, 246])
      .text(lesson.hashtags.join(' '), { align: 'center' })
    doc.moveDown(0.5)
  }

  // Hunks
  for (const hunk of lesson.hunks) {
    doc.fontSize(11).font('Helvetica').fillColor([30, 30, 30])
      .text(hunk.text, { align: 'left' })
    doc.moveDown(0.3)

    for (const q of hunk.questions) {
      const [r, g, b] = QUESTION_COLORS[q.type]
      doc.fontSize(11).font('Helvetica-Bold').fillColor([r, g, b])
        .text(q.question)
      if (q.answer) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor([0, 0, 0])
          .text(q.answer, { indent: 16 })
      }
      doc.moveDown(0.15)
    }
    doc.moveDown(0.4)
  }

  // References
  doc.moveDown(0.3)
  doc.fontSize(10).font('Helvetica-Bold').fillColor([0, 0, 0]).text('References')
  doc.moveDown(0.2)
  lesson.citations.forEach((c, i) => {
    doc.fontSize(9).font('Helvetica').fillColor([80, 80, 80])
      .text(`${i + 1}. ${c}`)
  })

  // Key at end
  doc.moveDown(1)
  doc.fontSize(8).font('Helvetica').fillColor([100, 100, 100])
    .text('Question Type Key: KNOWN | SEMI-OPEN | MATH | PRIOR KNOWLEDGE | OPEN | VAKT', { align: 'center' })

  doc.end()

  const pdf = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${lesson.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
    },
  })
}
