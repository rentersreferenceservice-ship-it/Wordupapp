import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPendingIntakeRequests } from '@/lib/intakeStore'
import { getSupabase } from '@/lib/supabase'
import DeleteIntakeButton from './DeleteIntakeButton'
import TextReminder from './TextReminder'

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
  const user = await currentUser()
  const practitionerName = user?.firstName || 'your practitioner'
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wordups2c.com'
  const unanswered = requests.filter(r => r.status === 'sent').length

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline mb-4 block">← Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Intakes &amp; Updates</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No intake requests yet.</p>
      ) : (
        <>
        {unanswered > 0 && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-900">
            <b>{unanswered} {unanswered === 1 ? 'family hasn’t' : 'families haven’t'} filled out their form yet.</b> Tap <b>💬 Text reminder</b> to open Messages on your phone with the reminder and their link already written — then pick the parent and send. Saving a phone number fills it in next time.
          </div>
        )}
        <ul className="space-y-2">
          {requests.map(r => (
            <li key={r.id} className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-3">
                <Link href={r.status === 'submitted' ? `/practitioner/inquiries/${r.id}` : '#'}
                  className={`flex-1 min-w-0 ${r.status === 'submitted' ? 'hover:underline' : 'cursor-default'}`}>
                  <p className="font-medium text-gray-900">
                    {r.studentId ? `Update — ${studentName(r.studentId) ?? 'Student'}` : 'New intake'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Sent {new Date(r.sentAt).toLocaleDateString()} via {r.channel}
                    {r.recipientEmail ? ` to ${r.recipientEmail}` : r.recipientPhone ? ` to ${r.recipientPhone}` : ''}
                  </p>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>
                    {r.status === 'sent' ? 'not filled out yet' : r.status === 'submitted' ? 'ready to review' : r.status}
                  </span>
                  <DeleteIntakeButton id={r.id} />
                </div>
              </div>
              {r.status === 'sent' && (
                <TextReminder requestId={r.id} link={`${origin}/intake/${r.token}`} studentName={r.studentId ? studentName(r.studentId) : null}
                  practitionerName={practitionerName} phone={r.recipientPhone} />
              )}
            </li>
          ))}
        </ul>
        </>
      )}
    </main>
  )
}
