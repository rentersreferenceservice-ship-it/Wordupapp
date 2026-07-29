import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function Row({ label, value }: { label: string; value?: string | string[] | null }) {
  const display = Array.isArray(value) ? value.join(', ') : value
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{display || '—'}</span>
    </div>
  )
}

function Section({ title, color = 'gray', children }: { title: string; color?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  }
  return (
    <div className={`rounded-xl border p-4 mb-4 ${colors[color] ?? colors.gray}`}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function s(fd: Record<string, unknown>, key: string): string {
  return (fd[key] as string) || ''
}
function a(fd: Record<string, unknown>, key: string): string[] {
  return (fd[key] as string[]) || []
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>
}) {
  const { id: studentId, submissionId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const supabase = getSupabase()

  const { data: student } = await supabase
    .from('students')
    .select('name')
    .eq('id', studentId)
    .eq('practitioner_id', userId)
    .single()

  if (!student) redirect('/practitioner/dashboard')

  const { data: sub } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .eq('practitioner_id', userId)
    .single()

  if (!sub) notFound()

  const fd = sub.form_data as Record<string, unknown>
  const submittedAt = new Date(sub.submitted_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href={`/practitioner/students/${studentId}`} className="text-sm text-blue-600 hover:underline mb-4 block">
          ← Back to {student.name}
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {sub.form_type === 'practitioner_event_log' && 'Letterboard Session Neurological Event & Motor Performance Log'}
            {sub.form_type === 'session_energy_log' && 'Session Energy, Motor & Performance Pattern Log'}
            {sub.form_type === 'family_event_log' && 'Suspected Neurological Event Log'}
          </h1>
          <p className="text-sm text-gray-400">Submitted {submittedAt} · {sub.submitted_by}</p>
        </div>

        {sub.form_type === 'practitioner_event_log' && (
          <>
            <Section title="Session Info">
              <Row label="Student" value={s(fd, 'studentName')} />
              <Row label="Date" value={s(fd, 'date')} />
              <Row label="Session start" value={s(fd, 'sessionStart')} />
              <Row label="Session end" value={s(fd, 'sessionEnd')} />
              <Row label="Board used" value={s(fd, 'boardUsed')} />
              <Row label="Video recorded" value={s(fd, 'videoRecorded')} />
            </Section>

            <Section title="Baseline" color="gray">
              <Row label="Overall regulation" value={a(fd, 'overallRegulation')} />
              <Row label="Regulation (other)" value={s(fd, 'overallRegulationOther')} />
              <Row label="Visual orientation" value={a(fd, 'visualOrientation')} />
              <Row label="Visual (other)" value={s(fd, 'visualOrientationOther')} />
              <Row label="Common motor pattern" value={a(fd, 'commonMotorPattern')} />
              <Row label="Motor pattern (other)" value={s(fd, 'commonMotorPatternOther')} />
              <Row label="Words attempted" value={s(fd, 'baselineWordsAttempted')} />
              <Row label="Letters attempted" value={s(fd, 'baselineLettersAttempted')} />
              <Row label="Accurate selections" value={s(fd, 'baselineAccurateSelections')} />
              <Row label="Accuracy %" value={s(fd, 'baselineAccuracyPct') ? `${s(fd, 'baselineAccuracyPct')}%` : ''} />
            </Section>

            <Section title="Suspected Event" color="blue">
              <Row label="Event start" value={s(fd, 'eventTimeStart')} />
              <Row label="Event end" value={s(fd, 'eventTimeEnd')} />
              <Row label="Duration" value={s(fd, 'eventDuration')} />
              <Row label="Activity before" value={s(fd, 'activityBefore')} />
              <Row label="First change noticed" value={s(fd, 'firstObservableChange')} />
              <Row label="Gaze / eyes" value={a(fd, 'gazeEyes')} />
              <Row label="Gaze (other)" value={s(fd, 'gazeEyesOther')} />
              <Row label="Responsiveness" value={a(fd, 'responsiveness')} />
              <Row label="Body / motor" value={a(fd, 'bodyMotor')} />
              <Row label="Body/motor (other)" value={s(fd, 'bodyMotorOther')} />
              <Row label="Description" value={s(fd, 'eventDescription')} />
            </Section>

            <Section title="After the Event" color="green">
              <Row label="Time until return" value={s(fd, 'timeUntilReturn')} />
              <Row label="Post-event session resumed" value={s(fd, 'postEventTimeResumed')} />
              <Row label="Observed after" value={a(fd, 'afterEvent')} />
              <Row label="After event (other)" value={s(fd, 'afterEventOther')} />
              <Row label="Post-event words" value={s(fd, 'postEventWords')} />
              <Row label="Post-event letters" value={s(fd, 'postEventLetters')} />
              <Row label="Post-event accurate" value={s(fd, 'postEventAccurate')} />
              <Row label="Post-event accuracy %" value={s(fd, 'postEventAccuracyPct') ? `${s(fd, 'postEventAccuracyPct')}%` : ''} />
              <Row label="Compared to baseline" value={a(fd, 'comparisonObservations')} />
              <Row label="Comparison (other)" value={s(fd, 'comparisonOther')} />
            </Section>

            <Section title="KNOWN Question" color="amber">
              <Row label="Result" value={s(fd, 'knownQuestion')} />
              <Row label="Question asked" value={s(fd, 'questionAsked')} />
              <Row label="Response" value={s(fd, 'questionResponse')} />
            </Section>

            <Section title="Summary">
              <Row label="Events this session" value={s(fd, 'numberOfEvents')} />
              <Row label="Accuracy associated" value={s(fd, 'accuracyAssociated')} />
              <Row label="Motor associated" value={s(fd, 'motorAssociated')} />
              <Row label="Visual associated" value={s(fd, 'visualAssociated')} />
              <Row label="Video timestamps" value={s(fd, 'videoTimestamps')} />
              <Row label="Additional observations" value={s(fd, 'additionalObservations')} />
            </Section>
          </>
        )}

        {sub.form_type === 'session_energy_log' && (
          <>
            <Section title="Session Info">
              <Row label="Student" value={s(fd, 'studentName')} />
              <Row label="Date" value={s(fd, 'sessionDate')} />
              <Row label="Session start" value={s(fd, 'sessionStart')} />
              <Row label="Session end" value={s(fd, 'sessionEnd')} />
              <Row label="Sleep / health factors" value={a(fd, 'sleepHealth')} />
            </Section>

            <Section title="Baseline" color="gray">
              <Row label="Energy / arousal" value={a(fd, 'baselineEnergy')} />
              <Row label="Regulation / body" value={a(fd, 'baselineRegulation')} />
              <Row label="Visual orientation" value={a(fd, 'baselineVisual')} />
              <Row label="Words attempted" value={s(fd, 'baselineWords')} />
              <Row label="Letters attempted" value={s(fd, 'baselineLetters')} />
              <Row label="Accurate selections" value={s(fd, 'baselineAccurate')} />
              <Row label="Accuracy %" value={s(fd, 'baselineAccuracyPct') ? `${s(fd, 'baselineAccuracyPct')}%` : ''} />
            </Section>

            <Section title="Session Tracking" color="blue">
              <p className="text-xs text-gray-500 mb-3">Time-interval data entered during the session.</p>
              {(() => {
                const rows = fd.trackingRows as Array<Record<string, string>> | undefined
                if (!rows?.length) return <p className="text-sm text-gray-400">No time-interval rows recorded.</p>
                return (
                  <div className="space-y-3">
                    {rows.map((row, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-xs font-bold text-gray-700 mb-1">{row.timePoint || `Interval ${i + 1}`}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                          {Object.entries(row).filter(([k]) => k !== 'timePoint').map(([k, v]) => (
                            v ? <div key={k}><span className="text-gray-500">{k}:</span> {v}</div> : null
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </Section>

            <Section title="Changes Observed">
              <Row label="Changes during session" value={a(fd, 'changesObserved')} />
              <Row label="Break taken" value={s(fd, 'breakTaken')} />
              <Row label="Break support" value={a(fd, 'breakSupport')} />
              <Row label="Post-break outcome" value={s(fd, 'postBreakOutcome')} />
            </Section>

            <Section title="Summary" color="amber">
              <Row label="Events today" value={s(fd, 'eventsToday')} />
              <Row label="Video timestamps" value={s(fd, 'videoTimestamps')} />
              <Row label="Additional observations" value={s(fd, 'additionalObservations')} />
            </Section>
          </>
        )}

        {sub.form_type === 'family_event_log' && (
          <>
            <Section title="Event Details">
              <Row label="Date" value={s(fd, 'date')} />
              <Row label="Day of week" value={s(fd, 'dayOfWeek')} />
              <Row label="Observer" value={s(fd, 'observer')} />
              <Row label="Time started" value={s(fd, 'timeStart')} />
              <Row label="Time ended" value={s(fd, 'timeEnd')} />
              <Row label="Duration" value={s(fd, 'duration')} />
            </Section>

            <Section title="Before the Episode" color="gray">
              <Row label="What he was doing" value={s(fd, 'doingBefore')} />
              <Row label="How he seemed" value={a(fd, 'seemedBefore')} />
              <Row label="Possible factors" value={a(fd, 'factors')} />
            </Section>

            <Section title="The Episode" color="blue">
              <Row label="First thing noticed" value={s(fd, 'firstNoticed')} />
              <Row label="Eyes / gaze" value={a(fd, 'eyes')} />
              <Row label="Head / body" value={a(fd, 'headBody')} />
              <Row label="Movements" value={a(fd, 'movements')} />
            </Section>

            <Section title="Responsiveness">
              <Row label="Responded to name" value={s(fd, 'respondName')} />
              <Row label="Responded to touch" value={s(fd, 'respondTouch')} />
              <Row label="Followed commands" value={s(fd, 'followCommands')} />
              <Row label="Spoke / communicated" value={s(fd, 'spokeDuring')} />
            </Section>

            <Section title="Afterward" color="green">
              <Row label="After episode" value={a(fd, 'afterEpisode')} />
              <Row label="Recovery time" value={s(fd, 'recoveryTime')} />
              <Row label="Recovery notes" value={s(fd, 'recoveryNotes')} />
            </Section>

            <Section title="Patterns & Video" color="amber">
              <Row label="Video recorded" value={s(fd, 'videoRecorded')} />
              <Row label="Video captured event" value={s(fd, 'videoCaptured')} />
              <Row label="Happened before" value={s(fd, 'happenedBefore')} />
              <Row label="Episodes today" value={s(fd, 'episodesToday')} />
              <Row label="Look similar to before" value={s(fd, 'lookSimilar')} />
              <Row label="Same or different" value={s(fd, 'sameDifferent')} />
              <Row label="Most important observation" value={s(fd, 'mostImportant')} />
            </Section>
          </>
        )}
      </div>
    </main>
  )
}
