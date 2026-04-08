import { NextRequest } from 'next/server'
import { getLesson } from '@/lib/lessonStore'
import PDFDocument from 'pdfkit'
import type { QuestionType } from '@/lib/types'

const QUESTION_COLORS: Record<QuestionType, [number, number, number]> = {
  KNOWN: [21, 128, 61],       // green
  'SEMI-OPEN': [249, 115, 22], // orange
  'PRIOR KNOWLEDGE': [37, 99, 235], // blue
  MATH: [126, 34, 206],       // purple
  VAKT: [220, 38, 38],        // red
  OPEN: [219, 39, 119],       // pink
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const doc = new PDFDocument({ margin: 72, size: 'LETTER' })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))

  const footerText = 'Question Type Key: KNOWN | SEMI-OPEN | MATH | PRIOR KNOWLEDGE | OPEN | VAKT'
  const creditLine = 'Word Up · AI Generated S2C Lesson'

  function drawFooter(pageNum: number) {
    const bottom = doc.page.height - 40
    doc.fontSize(8).fillColor([100, 100, 100])
      .text(footerText, 72, bottom, { align: 'center', width: doc.page.width - 144 })
    doc.text(`Page ${pageNum}`, 72, bottom + 14, { align: 'center', width: doc.page.width - 144 })
  }

  let pageNum = 1
  let drawingFooter = false

  function safeDrawFooter(num: number) {
    if (drawingFooter) return
    drawingFooter = true
    drawFooter(num)
    drawingFooter = false
  }

  safeDrawFooter(pageNum)

  doc.on('pageAdded', () => {
    pageNum++
    safeDrawFooter(pageNum)
  })

  // Title
  doc.fontSize(18).font('Helvetica-Bold').fillColor([0, 0, 0])
    .text(lesson.title, { align: 'center' })
  doc.moveDown(0.3)

  // Credit line — locked in, not editable
  doc.fontSize(9).font('Helvetica').fillColor([100, 100, 100])
    .text(creditLine, { align: 'center' })
  doc.moveDown(0.3)

  // Hashtags
  if (lesson.hashtags?.length) {
    doc.fontSize(9).fillColor([59, 130, 246])
      .text(lesson.hashtags.join(' '), { align: 'center' })
    doc.moveDown(0.5)
  }

  // Hunks
  for (const hunk of lesson.hunks) {
    doc.fontSize(12).font('Helvetica').fillColor([30, 30, 30])
      .text(hunk.text, { align: 'justify' })
    doc.moveDown(0.4)

    for (const q of hunk.questions) {
      const [r, g, b] = QUESTION_COLORS[q.type]
      doc.fontSize(12).font('Helvetica-Bold').fillColor([r, g, b])
        .text(q.question)
      if (q.answer) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor([0, 0, 0])
          .text(q.answer, { indent: 20 })
      }
      doc.moveDown(0.2)
    }

    doc.moveDown(0.5)
  }

  // References
  doc.moveDown(0.5)
  doc.fontSize(10).font('Helvetica-Bold').fillColor([0, 0, 0]).text('References')
  doc.moveDown(0.2)
  lesson.citations.forEach((c, i) => {
    doc.fontSize(9).font('Helvetica').fillColor([80, 80, 80])
      .text(`${i + 1}. ${c}`)
  })

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
