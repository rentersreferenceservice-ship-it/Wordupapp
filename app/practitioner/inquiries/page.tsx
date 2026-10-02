import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPendingIntakeRequests } from '@/lib/intakeStore'
import { getSupabase } from '@/lib/supabase'
import DeleteIntakeButton from './DeleteIntakeButton'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-gray-100 text-gray-600',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-400',
}

export default async function InquiriesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const requests = await getPendingIntakeRequests(userId)

  const studentIds = [...new Set(requests.map(r => r.studentId).filter((id): id is string => !!id))]
  const { data: students } = studentIds.length
    ? await getSupabase().from('students').select('id, name').in('id', studentIds)
    : { data: [] }
  const studentName = (id: string | null) => students?.find(s => s.id === id)?.name ?? null

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline mb-4 block">← Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Intakes &amp; Updates</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No intake requests yet.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map(r => (
            <li key={r.id}>
              <Link href={r.status === 'submitted' ? `/practitioner/inquiries/${r.id}` : '#'}
                className={`flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white ${r.status === 'submitted' ? 'hover:bg-gray-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-900">
                    {r.studentId ? `Update — ${studentName(r.studentId) ?? 'Student'}` : 'New intake'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Sent {new Date(r.sentAt).toLocaleDateString()} via {r.channel}
                    {r.recipientEmail ? ` to ${r.recipientEmail}` : r.recipientPhone ? ` to ${r.recipientPhone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                  <DeleteIntakeButton id={r.id} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
