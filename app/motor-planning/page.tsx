import type { Metadata } from 'next'
import TabletConnectionProvider from '@/app/components/TabletConnectionProvider'
import MotorPlanningLibrary from './MotorPlanningLibrary'

export const metadata: Metadata = {
  title: 'Motor Planning Exercises | Word Up',
  description: 'Upper-body motor planning exercises for spellers — torso, shoulder, arm, wrist and pointer finger — plus a pre-session warm-up and Reach & Poke.',
}

export default function MotorPlanningPage() {
  // relative z-10 + white: sit above the site's fixed background lettering
  return (
    <main className="relative z-10 min-h-screen bg-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">🖐️ Motor Planning Exercises</h1>
        <p className="text-sm text-gray-600 mt-1 mb-5">
          Upper-body exercises for pointing to letters, working from the middle out: a steady torso and shoulder let the arm reach
          with control, so the wrist stays steady and the pointer finger can work on its own. Almost everything can be done seated.
        </p>
        <TabletConnectionProvider>
          <MotorPlanningLibrary />
        </TabletConnectionProvider>
      </div>
    </main>
  )
}
