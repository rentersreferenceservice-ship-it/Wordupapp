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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Tools &amp; Assessments</h1>

        <div className="space-y-4">
          <p className="text-sm text-gray-400 text-center py-12">Coming soon — tools and assessments will appear here.</p>
        </div>
      </div>
    </main>
  )
}
