import { notFound } from 'next/navigation'
import { getLesson } from '@/lib/lessonStore'
import { getUserUsage } from '@/lib/usageStore'
import type { QuestionType } from '@/lib/types'
import PrintButton from './PrintButton'
import DeleteButton from './DeleteButton'
import EditTypesButton from './EditTypesButton'
import SuggestEditButton from './SuggestEditButton'
import VerifyToggle from './VerifyToggle'
import FactCheckButton from './FactCheckButton'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { generateQRDataUrl } from '@/lib/qrcode'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export const dynamic = 'force-dynamic'

const QUESTION_COLORS: Record<QuestionType, string> = {
  'KNOWN': 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  'MATH': 'text-purple-700',
  'VAKT': 'text-red-500',
  'OPEN': 'text-pink-500',
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) notFound()

  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId
  } catch { /* guest */ }

  const isAdmin = userId === ADMIN_USER_ID

  let isSubscribed = isAdmin
  if (userId && !isAdmin) {
    try {
      const usage = await getUserUsage(userId)
      isSubscribed = usage.isSubscribed
    } catch {
      isSubscribed = false
    }
  }

  const qrMap: Record<string, string> = {}
  if (isSubscribed) {
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

  // ── PREVIEW MODE for non-subscribers ──────────────────────────────────────
  if (!isSubscribed) {
    const firstHunk = lesson.hunks[0]
    const lockedCount = lesson.hunks.length - 1

    return (
      <div className="min-h-screen">
        <nav className="relative z-10 print:hidden flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Link href="/lessons" className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">← All Lessons</Link>
          </div>
          <div className="flex gap-3">
            <SuggestEditButton lessonId={id} lessonTitle={lesson.title} variant="button" />
            <a href="/subscribe" className="bg-yellow-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
              Subscribe $9.99/mo
            </a>
          </div>
        </nav>

        <article className="relative z-10 max-w-4xl mx-auto px-8 py-8 my-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg font-[Arial,sans-serif] text-[14pt] leading-snug">
          <div className="flex justify-center mb-1">
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 object-contain" />
          </div>
          <p className="text-center text-[10pt] text-gray-500 mb-3">{lesson.isAiGenerated === false ? 'S2C Lesson' : 'AI Generated S2C Lesson'}</p>
          <h1 className="text-2xl font-bold text-center mb-1">{lesson.title}</h1>
          {lesson.author && <p className="text-center text-[9pt] text-gray-500 mb-1">By {lesson.author}</p>}
          {lesson.hashtags?.length > 0 && (
            <p className="text-center text-sm text-blue-500 mb-4">{lesson.hashtags.join(' ')}</p>
          )}
          {lesson.verified && (
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                ✓ Verified for Accuracy
              </span>
            </div>
          )}

          {/* Preview banner */}
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl px-5 py-3 text-center">
            <p className="text-sm font-semibold text-yellow-800">Preview — Section 1 of {lesson.hunks.length}</p>
            <p className="text-xs text-yellow-700 mt-0.5">Subscribe to unlock all {lesson.hunks.length} sections, print, and use this lesson in a live session.</p>
          </div>

          {/* Hunk 1 — fully visible */}
          {firstHunk && (
            <section className="mb-8">
              {firstHunk.imageUrl && (
                <img src={firstHunk.imageUrl} alt={firstHunk.imageAlt || ''} className="w-full max-h-48 object-contain rounded-xl mb-3 bg-gray-50" />
              )}
              <p className="mb-3 text-gray-900 leading-relaxed">{firstHunk.text}</p>
              <div className="space-y-2 pl-2">
                {firstHunk.questions.map((q, qi) => (
                  <div key={qi} className="flex items-start gap-3">
                    <div className="flex-1">
                      <span className={`font-medium ${QUESTION_COLORS[q.type]}`}>{q.question}</span>
                      {q.answer && <div className="ml-4 text-black font-normal">{q.answer}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {firstHunk.writingPrompt && (
                <div className="mt-3 border border-pink-200 rounded-lg p-3 bg-pink-50">
                  <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Writing Prompt</p>
                  <p className="text-sm text-pink-600">{firstHunk.writingPrompt}</p>
                </div>
              )}
            </section>
          )}

          {/* Locked hunks */}
          {lockedCount > 0 && (
            <div className="space-y-3 mb-8">
              {lesson.hunks.slice(1).map(h => (
                <div key={h.number} className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Section {h.number}</p>
                    <p className="text-xs text-gray-400">Subscribe to unlock this section</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subscribe CTA */}
          <div className="text-center py-6 border-t border-gray-100">
            <p className="text-base font-semibold text-gray-700 mb-1">Unlock all {lesson.hunks.length} sections</p>
            <p className="text-sm text-gray-500 mb-4">Subscribe for $9.99/month to access the full library, print lessons, and run live sessions.</p>
            <a href="/subscribe" className="inline-block bg-yellow-200 text-gray-800 px-8 py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-colors">
              Subscribe $9.99/mo
            </a>
          </div>
        </article>
      </div>
    )
  }

  // ── FULL VIEW for subscribers ──────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <nav className="relative z-10 print:hidden flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <div className="flex gap-3">
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ New Lesson</Link>
          <Link href="/lessons" className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">← All Lessons</Link>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <SuggestEditButton lessonId={id} lessonTitle={lesson.title} variant="button" />
          <PrintButton />
          <a
            href="mailto:wordups2c@gmail.com"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Contact
          </a>
          {isAdmin && <FactCheckButton lessonId={id} />}
          {isAdmin && <VerifyToggle lessonId={id} initialVerified={lesson.verified ?? false} />}
          {isAdmin && <Link href={`/lessons/${id}/edit`} className="bg-yellow-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors">Edit Lesson</Link>}
          {isAdmin && <EditTypesButton lessonId={id} initialHunks={lesson.hunks} />}
          {isAdmin && <DeleteButton />}
        </div>
      </nav>

      <article className="relative z-10 max-w-4xl mx-auto px-8 py-8 my-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg font-[Arial,sans-serif] text-[14pt] leading-snug">
        <div className="flex justify-center mb-1">
          <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 object-contain" />
        </div>
        <p className="print:hidden text-center text-[10pt] text-gray-500">worduplessongenerator.com</p>
        <p className="text-center text-[10pt] text-gray-500 mb-3">{lesson.isAiGenerated === false ? 'S2C Lesson' : 'AI Generated S2C Lesson'}</p>
        <h1 className="text-2xl font-bold text-center mb-1">{lesson.title}</h1>
        {lesson.author && <p className="text-center text-[9pt] text-gray-500 mb-1">By {lesson.author}</p>}

        {lesson.hashtags?.length > 0 && (
          <p className="text-center text-sm text-blue-500 mb-4">
            {lesson.hashtags.join(' ')}
          </p>
        )}
        {lesson.verified && (
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              ✓ Verified for Accuracy
            </span>
          </div>
        )}

        {lesson.hunks.map((hunk) => (
          <section key={hunk.number} className="mb-8">
            {hunk.imageUrl && (
              <img
                src={hunk.imageUrl}
                alt={hunk.imageAlt || ''}
                className="w-full max-h-48 object-contain rounded-xl mb-3 bg-gray-50"
              />
            )}
            <p className="mb-3 text-gray-900 leading-relaxed">{hunk.text}</p>
            <div className="space-y-2 pl-2">
              {hunk.questions.map((q, qi) => {
                const qrDataUrl = q.type === 'VAKT' ? qrMap[`${hunk.number}-${qi}`] : undefined
                return (
                  <div key={qi}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <span className={`font-medium ${QUESTION_COLORS[q.type]}`}>{q.question}</span>
                        {q.answer && (
                          <div className="ml-4 text-black font-normal">{q.answer}</div>
                        )}
                      </div>
                      {qrDataUrl && (
                        <div className="shrink-0 text-center" style={{maxWidth:96}}>
                          <img src={qrDataUrl} alt="YouTube QR" width={80} height={80} />
                          {q.youtubeDescription && <p className="text-[7pt] text-gray-600 mt-0.5 leading-tight">{q.youtubeDescription}</p>}
                          {q.youtubeDuration && q.youtubeVideoTitle && (
                            <p className="text-[7pt] text-gray-400 mt-0.5 leading-tight">{q.youtubeDuration} — {q.youtubeVideoTitle}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {hunk.writingPrompt && (
              <div className="mt-3 border border-pink-200 rounded-lg p-3 bg-pink-50">
                <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Writing Prompt</p>
                <p className="text-sm text-pink-600">{hunk.writingPrompt}</p>
              </div>
            )}
          </section>
        ))}

        <section className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="font-bold text-sm mb-2">References</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            {lesson.citations.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </section>

        <SuggestEditButton lessonId={id} lessonTitle={lesson.title} />

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
