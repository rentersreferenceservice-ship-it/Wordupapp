import { listLessons } from '@/lib/lessonStore'
import LessonBrowser from './LessonBrowser'
import { auth } from '@clerk/nextjs/server'
import { getUserUsage } from '@/lib/usageStore'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LessonsPage() {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId
  } catch (e) {
    console.error('Auth error on lessons page:', e)
  }

  if (!userId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
          <img src="/word_up_clean.jpeg" alt="Word Up Logo" className="mx-auto mb-4" style={{ width: 180 }} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-sm text-gray-600 mb-6">The lesson library is available to subscribers. Sign in and subscribe to access your lessons.</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors inline-block">
            Go to Home
          </Link>
        </div>
      </main>
    )
  }

  let usage = { isSubscribed: false, lessonsThisMonth: 0, printsThisMonth: 0, monthKey: '' }
  try {
    usage = await getUserUsage(userId)
  } catch (e) {
    console.error('Supabase error on lessons page:', e)
  }

  if (!usage.isSubscribed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
          <img src="/word_up_clean.jpeg" alt="Word Up Logo" className="mx-auto mb-4" style={{ width: 180 }} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-sm text-gray-600 mb-6">Subscribe for $9.99/month to access the lesson library and generate up to 20 lessons per month.</p>
          <Link href="/" className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors inline-block">
            Subscribe $9.99/mo
          </Link>
        </div>
      </main>
    )
  }

  const lessons = await listLessons()
  return <LessonBrowser lessons={lessons} />
}
