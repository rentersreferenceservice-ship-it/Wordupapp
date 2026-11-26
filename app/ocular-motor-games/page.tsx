import type { Metadata } from 'next'
import TabletConnectionProvider from '@/app/components/TabletConnectionProvider'
import OcularMotorLibrary from './OcularMotorLibrary'

export const metadata: Metadata = {
  title: 'Ocular Motor Games | Word Up',
  description: 'Short ocular motor and eye-hand coordination activities for spellers — tap-only, big targets, no timers.',
}

export default function OcularMotorGamesPage() {
  // relative z-10 + white: sit above the site's fixed background lettering
  return (
    <main className="relative z-10 min-h-screen bg-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">👀 Ocular Motor Games</h1>
        <p className="text-sm text-gray-600 mt-1 mb-5">
          Short activities to practice eye movement (ocular motor skills) and hand-eye coordination. Everything is tap-only with big targets and no timers.
          Pick the settings for your speller, then play here or send it to their tablet.
        </p>
        <TabletConnectionProvider>
          <OcularMotorLibrary />
        </TabletConnectionProvider>
      </div>
    </main>
  )
}
