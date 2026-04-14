import { notFound } from 'next/navigation'
import { getLesson } from '@/lib/lessonStore'
import type { QuestionType } from '@/lib/types'
import PrintButton from './PrintButton'
import DeleteButton from './DeleteButton'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export const dynamic = 'force-dynamic'

const QUESTION_COLORS: Record<QuestionType, string> = {
  'KNOWN': 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  'MATH': 'text-purple-700',
  'VAKT': 'text-red-600',
  'OPEN': 'text-pink-600',
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) notFound()

  const { userId } = await auth()
  const isAdmin = userId === ADMIN_USER_ID

  return (
    <div className="min-h-screen">
      <nav className="relative z-10 print:hidden flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/lessons" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">← All Lessons</Link>
        <div className="flex gap-3">
          <PrintButton />
          <a
            href="mailto:wordups2c@gmail.com"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Contact
          </a>
          {isAdmin && <DeleteButton />}
        </div>
      </nav>

      <article className="relative z-10 max-w-4xl mx-auto px-8 py-8 my-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg font-[Arial,sans-serif] text-[14pt] leading-snug">
        <div className="flex justify-center mb-1">
          <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 object-contain" />
        </div>
        <p className="print:hidden text-center text-[10pt] text-gray-500">worduplessongenerator.com</p>
        <p className="text-center text-[10pt] text-gray-500 mb-3">AI Generated S2C Lesson</p>
        <h1 className="text-2xl font-bold text-center mb-1">{lesson.title}</h1>

        {lesson.hashtags?.length > 0 && (
          <p className="text-center text-sm text-blue-500 mb-8">
            {lesson.hashtags.join(' ')}
          </p>
        )}

        {lesson.hunks.map((hunk) => (
          <section key={hunk.number} className="mb-8">
            {hunk.imageUrl && (
              <img
                src={hunk.imageUrl}
                alt={hunk.imageAlt || ''}
                className="w-full h-48 object-cover rounded-xl mb-3"
              />
            )}
            <p className="mb-3 text-gray-900 leading-relaxed">{hunk.text}</p>
            <div className="space-y-2 pl-2">
              {hunk.questions.map((q, qi) => (
                <div key={qi}>
                  <span className={`font-medium ${QUESTION_COLORS[q.type]}`}>{q.question}</span>
                  {q.answer && (
                    <div className="ml-4 text-black font-normal">{q.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

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
