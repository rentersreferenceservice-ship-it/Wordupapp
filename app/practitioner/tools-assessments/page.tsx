import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription } from '@/lib/practitionerStore'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ToolsAssessmentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const subscription = await getPractitionerSubscription(userId)
  if (!subscription?.isActive) redirect('/practitioner/subscribe')

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tools &amp; Assessments</h1>
        <p className="text-sm text-gray-500 mb-8">Printable forms and clinical observation tools for S2C practitioners and families.</p>

        <div className="space-y-6">

          {/* Seizure Log — Practitioner */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Printable PDF Form</div>
                <h2 className="text-base font-bold text-gray-900 mb-2">
                  S2C Session Neurological Event &amp; Motor Performance Observation Log
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  For the child&apos;s S2C practitioner. Tracks suspected neurological events during spelling sessions — gaze, responsiveness, motor control, spelling accuracy before and after each observed episode. Designed for clinical review by a neurologist.
                </p>
                <Link
                  href="/practitioner/tools-assessments/seizure-log-practitioner"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Open &amp; Print Form →
                </Link>
              </div>
            </div>
          </div>

          {/* Seizure Log — Family */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Printable PDF Form</div>
                <h2 className="text-base font-bold text-gray-900 mb-2">
                  Suspected Neurological Event Observation Log — Family / Home Tracking Form
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  A simpler form for family members and caregivers to document suspected episodes at home. Covers what the child was doing before, what the episode looked like, responsiveness, recovery, and video documentation. Intended for the child&apos;s neurologist.
                </p>
                <Link
                  href="/practitioner/tools-assessments/seizure-log-family"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
                >
                  Open &amp; Print Form →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
