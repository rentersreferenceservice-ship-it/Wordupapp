import Link from 'next/link'
import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import { getLesson } from '@/lib/lessonStore'
import TypeToTalkSurface from '../components/TypeToTalkSurface'

export const dynamic = 'force-dynamic'

export default async function TypeToTalkPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const { lesson: lessonId } = await searchParams
  const lesson = lessonId ? await getLesson(lessonId).catch(() => null) : null

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Type to Talk</h1>
            <p className="text-sm text-gray-500 mt-1">
              Free for everyone, no account needed. Type on any keyboard — the on-screen keyboard on a tablet or a Bluetooth keyboard both work.
              Letters are spoken as they&apos;re typed, the word once you hit space, the sentence on a period, and the whole paragraph after pressing Enter twice.
            </p>
          </div>

          {lesson && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Using with lesson</p>
                <p className="text-sm font-semibold text-blue-900">{lesson.title}</p>
              </div>
              <Link href={`/lessons/${lesson.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline whitespace-nowrap">
                View lesson
              </Link>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <TypeToTalkSurface rows={14} />
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
