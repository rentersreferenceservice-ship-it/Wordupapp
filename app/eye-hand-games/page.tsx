import type { Metadata } from 'next'
import TabletConnectionProvider from '@/app/components/TabletConnectionProvider'
import EyeHandLibrary from './EyeHandLibrary'

export const metadata: Metadata = {
  title: 'Eye-Hand Games | Word Up',
  description: 'Short eye-hand coordination activities for spellers — tap-only, big targets, no timers.',
}

export default function EyeHandGamesPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">👀 Eye-Hand Games</h1>
        <p className="text-sm text-gray-600 mt-1 mb-5">
          Short activities to practice eye movement and hand-eye coordination. Everything is tap-only with big targets and no timers.
          Pick the settings for your speller, then play here or send it to their tablet.
        </p>
        <TabletConnectionProvider>
          <EyeHandLibrary />
        </TabletConnectionProvider>
      </div>
    </main>
  )
}
