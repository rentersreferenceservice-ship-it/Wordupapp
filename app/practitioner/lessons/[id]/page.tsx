import { notFound, redirect } from 'next/navigation'
import { getLesson } from '@/lib/lessonStore'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import PrintButton from '@/app/lessons/[id]/PrintButton'
import DeleteButton from '@/app/lessons/[id]/DeleteButton'
import EditTypesButton from '@/app/lessons/[id]/EditTypesButton'
import FactCheckButton from '@/app/lessons/[id]/FactCheckButton'
import VerifyToggle from '@/app/lessons/[id]/VerifyToggle'
import TranslateButton from '@/app/lessons/[id]/TranslateButton'
import { generateQRDataUrl } from '@/lib/qrcode'
import { getStudents } from '@/lib/practitionerStore'
import LessonHunkEditor from './LessonHunkEditor'

export const dynamic = 'force-dynamic'


export default async function PractitionerLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')


  const isAdmin = userId === 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

  const [lesson, students] = await Promise.all([
    getLesson(id),
    getStudents(userId),
  ])
  if (!lesson) notFound()

  // Pre-generate QR codes for VAKT questions that have a youtubeQuery
  const qrMap: Record<string, string> = {}
  await Promise.all(
    lesson.hunks.flatMap(h =>
      h.questions.map(async (q, qi) => {
        if (q.type === 'VAKT' && q.youtubeQuery) {
          const key = `${h.number}-${qi}`
          qrMap[key] = await generateQRDataUrl(q.youtubeVideoId, q.youtubeQuery)
        }
      })
    )
  )

  return (
    <div className="min-h-screen">
      <nav className="relative z-10 print:hidden flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <div className="flex gap-3">
          <Link href="/practitioner/generate" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ New Lesson</Link>
          <Link href="/practitioner/library" className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">← Practitioner Library</Link>
        </div>
        <div className="flex gap-3">
          <PrintButton />
          <TranslateButton lessonId={id} />
          <a
            href="mailto:wordups2c@gmail.com"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Contact
          </a>
          {isAdmin && <FactCheckButton lessonId={id} />}
          {isAdmin && <VerifyToggle lessonId={id} initialVerified={lesson.verified ?? false} />}
          <EditTypesButton lessonId={id} initialHunks={lesson.hunks} />
          {isAdmin && <DeleteButton redirectTo="/practitioner/library" />}
        </div>
      </nav>

      <article className="relative z-10 max-w-4xl mx-auto px-8 py-8 my-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg font-[Arial,sans-serif] text-[14pt] leading-snug">
        <div className="flex justify-center mb-1">
          <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 object-contain" />
        </div>
        <p className="print:hidden text-center text-[10pt] text-gray-500">worduplessongenerator.com</p>
        <p className="text-center text-[10pt] text-gray-500">wordups2c@gmail.com</p>
        <p className="text-center text-[10pt] text-gray-500 mb-3">{lesson.isAiGenerated === false ? 'Letterboard Lesson' : 'AI Generated Letterboard Lesson'}</p>
        <h1 className="text-2xl font-bold text-center mb-1">{lesson.title}</h1>
        {lesson.author && <p className="text-center text-[9pt] text-gray-500 mb-1">By {lesson.author}</p>}

        {lesson.hashtags?.length > 0 && (
          <p className="text-center text-sm text-blue-500 mb-8">
            {lesson.hashtags.join(' ')}
          </p>
        )}

        <LessonHunkEditor
          lessonId={id}
          lessonTitle={lesson.title}
          initialHunks={lesson.hunks}
          qrMap={qrMap}
          students={students}
          isAdmin={isAdmin}
          fullLesson={lesson}
        />

        <section className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="font-bold text-sm mb-2">References</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            {lesson.citations.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </section>

        <footer className="print:hidden mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          Question Type Key:{' '}
          <span className="text-green-700 font-medium">KNOWN</span> |{' '}
          <span className="text-orange-500 font-medium">SEMI-OPEN</span> |{' '}
          <span className="text-purple-700 font-medium">MATH</span> |{' '}
          <span className="text-blue-600 font-medium">PRIOR KNOWLEDGE</span> |{' '}
          <span className="text-pink-600 font-medium">OPEN</span> |{' '}
          <span className="text-red-600 font-medium">VAKT</span>
        </footer>

        <div className="hidden print:block text-center border-t border-gray-300 pt-2 mt-8" style={{fontSize:'8pt', fontFamily:'Arial, sans-serif'}}>
          Key: <span style={{color:'#15803d',fontWeight:'bold'}}>KNOWN</span> | <span style={{color:'#f97316',fontWeight:'bold'}}>SEMI-OPEN</span> | <span style={{color:'#7e22ce',fontWeight:'bold'}}>MATH</span> | <span style={{color:'#2563eb',fontWeight:'bold'}}>PRIOR KNOWLEDGE</span> | <span style={{color:'#db2777',fontWeight:'bold'}}>OPEN</span> | <span style={{color:'#dc2626',fontWeight:'bold'}}>VAKT</span>
        </div>
      </article>
    </div>
  )
}
