import type { Metadata } from 'next'
import Link from 'next/link'
import HomeActivities from './HomeActivities'

export const metadata: Metadata = {
  title: 'At-Home Activities | Word Up',
  description: 'Everyday chores and play that build the motor planning spellers use to point to letters — with a printable family practice sheet.',
}

export default function AtHomePage() {
  // relative z-10 + white: sit above the site's fixed background lettering
  return (
    <main className="relative z-10 min-h-screen bg-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <HomeActivities />
        <p className="text-sm text-gray-500 pt-2">
          For session exercises, the pre-session warm-up and Reach &amp; Poke, see{' '}
          <Link href="/motor-planning" className="text-blue-600 underline">Motor Planning Exercises</Link>.
        </p>
      </div>
    </main>
  )
}
