import { NextRequest } from 'next/server'
import { getLesson } from '@/lib/lessonStore'
import PdfPrinter from 'pdfmake'
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  }

  const printer = new PdfPrinter(fonts)

  // Logo as base64
  const logoPath = path.join(process.cwd(), 'public', 'word_up_clean.jpeg')
  const logoData = fs.existsSync(logoPath)
    ? fs.readFileSync(logoPath).toString('base64')
    : null

  const content: object[] = []

  // Logo
  if (logoData) {
    content.push({
      image: `data:image/jpeg;base64,${logoData}`,
      width: 100,
      alignment: 'center',
      margin: [0, 0, 0, 4],
    })
  }

  // Credit + title
  content.push({ text: 'AI Generated S2C Lesson', style: 'credit' })
  content.push({ text: lesson.title, style: 'title' })

  // Hashtags
  if (lesson.hashtags?.length) {
    content.push({ text: lesson.hashtags.join(' '), style: 'hashtags' })
  }

  // Hunks
  for (const hunk of lesson.hunks) {
    content.push({ text: hunk.text, style: 'hunkText', margin: [0, 8, 0, 4] })

    for (const q of hunk.questions) {
      content.push({
        text: q.question,
        style: 'question',
        color: QUESTION_COLORS[q.type],
      })
      if (q.answer) {
        content.push({
          text: q.answer,
          style: 'answer',
          margin: [16, 0, 0, 2],
        })
      }
    }
    content.push({ text: '', margin: [0, 0, 0, 6] })
  }

  // References
  content.push({ text: 'References', style: 'refsHeader', margin: [0, 8, 0, 4] })
  lesson.citations.forEach((c, i) => {
    content.push({ text: `${i + 1}. ${c}`, style: 'ref' })
  })

  const docDef = {
    pageSize: 'LETTER',
    pageMargins: [72, 72, 72, 60],
    content,
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        {
          text: 'Question Type Key: KNOWN | SEMI-OPEN | MATH | PRIOR KNOWLEDGE | OPEN | VAKT',
          alignment: 'center',
          fontSize: 7,
          color: '#888',
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          fontSize: 7,
          color: '#888',
        },
      ],
      margin: [72, 8, 72, 0],
    }),
    styles: {
      credit: { fontSize: 8, color: '#888', alignment: 'center', margin: [0, 0, 0, 2] },
      title: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      hashtags: { fontSize: 8, color: '#3b82f6', alignment: 'center', margin: [0, 0, 0, 8] },
      hunkText: { fontSize: 11, font: 'Helvetica' },
      question: { fontSize: 11, bold: true },
      answer: { fontSize: 11, bold: true, color: '#000' },
      refsHeader: { fontSize: 10, bold: true },
      ref: { fontSize: 8, color: '#555', margin: [0, 0, 0, 2] },
    },
    defaultStyle: { font: 'Helvetica' },
  }

  const pdfDoc = printer.createPdfKitDocument(docDef as any)
  const chunks: Buffer[] = []

  pdfDoc.on('data', chunk => chunks.push(chunk))

  const pdf = await new Promise<Buffer>((resolve) => {
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
    pdfDoc.end()
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${lesson.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
    },
  })
}
