'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  form_type: string
  form_data: Record<string, unknown>
  submitted_at: string
  submitted_by: string
}

function fd(sub: Submission, key: string): string {
  return (sub.form_data[key] as string) || ''
}
function fa(sub: Submission, key: string): string[] {
  return (sub.form_data[key] as string[]) || []
}
function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtTs(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '20px 0' }} />
}

function SectionHeader({ title, color = '#1e3a5f' }: { title: string; color?: string }) {
  return (
    <div style={{ background: color, color: 'white', padding: '6px 14px', borderRadius: '4px', fontSize: '10pt', fontWeight: 'bold', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '20px' }}>
      {title}
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', background: '#f9fafb' }}>
      <div style={{ fontSize: '22pt', fontWeight: 'bold', color: '#1e3a5f' }}>{value}</div>
      <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#374151', marginTop: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '8pt', color: '#6b7280', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | string[] | null }) {
  const display = Array.isArray(value) ? value.join(', ') : value
  if (!display) return null
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '4px 0', fontSize: '9.5pt', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '160px', flexShrink: 0 }}>{label}:</span>
      <span style={{ color: '#111827' }}>{display}</span>
    </div>
  )
}

export default function ObservationReportClient({
  studentId,
  studentName,
  start,
  end,
  submissions,
}: {
  studentId: string
  studentName: string
  start: string
  end: string
  submissions: Submission[]
}) {
  const router = useRouter()
  const [startDate, setStartDate] = useState(start)
  const [endDate, setEndDate] = useState(end)

  const handleApply = useCallback(() => {
    router.push(`/practitioner/students/${studentId}/observation-report?start=${startDate}&end=${endDate}`)
  }, [router, studentId, startDate, endDate])

  const [showEmailPanel, setShowEmailPanel] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e.includes('@')) return
    if (!emailList.includes(e)) setEmailList(prev => [...prev, e])
    setEmailInput('')
  }

  const eventLogs = submissions.filter(s => s.form_type === 'practitioner_event_log')
  const energyLogs = submissions.filter(s => s.form_type === 'session_energy_log')
  const familyLogs = submissions.filter(s => s.form_type === 'family_event_log')

  // Period split for trend
  const midMs = (new Date(start).getTime() + new Date(end).getTime()) / 2
  const mid = new Date(midMs).toISOString()
  const earlyEvents = eventLogs.filter(s => s.submitted_at < mid)
  const lateEvents = eventLogs.filter(s => s.submitted_at >= mid)
  const earlyFamily = familyLogs.filter(s => s.submitted_at < mid)
  const lateFamily = familyLogs.filter(s => s.submitted_at >= mid)

  // Accuracy impact
  const accComps = eventLogs
    .filter(s => fd(s, 'baselineAccuracyPct') && fd(s, 'postEventAccuracyPct'))
    .map(s => ({
      date: fd(s, 'date') || fmtTs(s.submitted_at),
      baseline: parseFloat(fd(s, 'baselineAccuracyPct')),
      post: parseFloat(fd(s, 'postEventAccuracyPct')),
      diff: parseFloat(fd(s, 'postEventAccuracyPct')) - parseFloat(fd(s, 'baselineAccuracyPct')),
    }))
  const avgAccDiff = accComps.length ? accComps.reduce((s, c) => s + c.diff, 0) / accComps.length : null

  // Pattern frequency
  function countFreq(subs: Submission[], key: string): [string, number][] {
    const counts: Record<string, number> = {}
    subs.forEach(s => fa(s, key).forEach(v => { counts[v] = (counts[v] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }
  const gazeFreq = countFreq(eventLogs, 'gazeEyes')
  const responseFreq = countFreq(eventLogs, 'responsiveness')
  const bodyFreq = countFreq(eventLogs, 'bodyMotor')
  const afterFreq = countFreq(eventLogs, 'afterEvent')
  const familyMovFreq = countFreq(familyLogs, 'movements')
  const familyEyeFreq = countFreq(familyLogs, 'eyes')

  const periodLabel = `${fmt(start)} – ${fmt(end)}`
  const generatedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const totalEvents = eventLogs.length + familyLogs.length
  const hasData = totalEvents > 0 || energyLogs.length > 0

  function trendLabel(early: number, late: number) {
    if (early === 0 && late === 0) return null
    if (early === late) return 'Stable across the period'
    return late < early
      ? `Decreased: ${early} in first half → ${late} in second half`
      : `Increased: ${early} in first half → ${late} in second half`
  }

  async function handleSend() {
    if (!emailList.length) return
    setSending(true)
    setSendStatus('Sending…')
    try {
      const res = await fetch(`/api/practitioner/observation-report/${studentId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start, end, studentName,
          emails: emailList,
          summary: {
            eventCount: eventLogs.length,
            familyCount: familyLogs.length,
            energyCount: energyLogs.length,
            totalObservations: totalEvents + energyLogs.length,
            eventTrend: eventLogs.length > 1 ? trendLabel(earlyEvents.length, lateEvents.length) : null,
            eventTrendPositive: lateEvents.length < earlyEvents.length,
            eventTrendNegative: lateEvents.length > earlyEvents.length,
            familyTrend: familyLogs.length > 1 ? trendLabel(earlyFamily.length, lateFamily.length) : null,
            familyTrendPositive: lateFamily.length < earlyFamily.length,
            familyTrendNegative: lateFamily.length > earlyFamily.length,
            accuracyBlurb: avgAccDiff !== null
              ? (Math.abs(avgAccDiff) <= 5
                ? 'Post-event accuracy remained near baseline — minimal motor impact observed'
                : avgAccDiff < 0
                ? `Post-event accuracy averaged ${Math.abs(avgAccDiff).toFixed(0)}% below baseline — motor impact on spelling output observed`
                : `Post-event accuracy averaged ${avgAccDiff.toFixed(0)}% above baseline`)
              : null,
          },
        }),
      })
      const d = await res.json()
      setSendStatus(res.ok ? 'Sent ✓' : ('Error: ' + (d.error ?? 'Send failed')))
    } catch {
      setSendStatus('Error sending')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <style>{`
        body { background: white !important; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 0.7in 0.8in; size: letter portrait; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#1e3a5f', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link href={`/practitioner/students/${studentId}`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap' }}>← {studentName}</Link>
        <span style={{ fontSize: '13px', flex: 1, whiteSpace: 'nowrap' }}>Clinical Observation Report</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '12px' }} />
          <span style={{ color: '#93c5fd' }}>to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '12px' }} />
          <button onClick={handleApply} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Apply</button>
        </div>
        <button onClick={() => setShowEmailPanel(v => !v)} style={{ background: showEmailPanel ? '#3b82f6' : 'white', color: showEmailPanel ? 'white' : '#1e3a5f', border: 'none', padding: '6px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ✉ Email to Family
        </button>
        <button onClick={() => window.print()} style={{ background: 'white', color: '#1e3a5f', border: 'none', padding: '6px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Print / Save as PDF
        </button>
      </div>

      {showEmailPanel && (
        <div className="no-print" style={{ maxWidth: '780px', margin: '16px auto 0', padding: '20px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '10px' }}>Email Summary to Family</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
            Sends a summary (counts, trends, accuracy impact) — not the full record of individual entries.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
            />
            <button onClick={addEmail} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
          </div>
          {emailList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {emailList.map(e => (
                <span key={e} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8' }}>
                  {e}
                  <button onClick={() => setEmailList(prev => prev.filter(x => x !== e))} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', lineHeight: 1, fontSize: '14px' }}>×</button>
                </span>
              ))}
            </div>
          )}
          <button onClick={handleSend} disabled={sending || !emailList.length} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: sending || !emailList.length ? 'default' : 'pointer', opacity: sending || !emailList.length ? 0.5 : 1 }}>
            {sending ? 'Sending…' : `Send to ${emailList.length || 0} recipient${emailList.length !== 1 ? 's' : ''}`}
          </button>
          {sendStatus && <p style={{ fontSize: '13px', marginTop: '8px', color: sendStatus.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{sendStatus}</p>}
        </div>
      )}

      {/* Report body */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 36px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#111827', fontSize: '10pt', background: 'white' }}>

        {/* Header */}
        <div style={{ borderBottom: '3px solid #1e3a5f', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '8pt', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
            Spelling to Communicate (S2C) — Clinical Documentation
          </div>
          <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1e3a5f', lineHeight: 1.2 }}>
            Neurological Observation &amp; Motor Performance Report
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '40px', flexWrap: 'wrap', fontSize: '9.5pt' }}>
            <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Student: </span>{studentName}</div>
            <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Reporting Period: </span>{periodLabel}</div>
            <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Generated: </span>{generatedDate}</div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '8.5pt', color: '#6b7280', fontStyle: 'italic' }}>
            This report documents neurological observations made during S2C spelling sessions and by the student's family at home.
            It is intended for review by the student's treating medical professionals and is not a clinical diagnosis.
          </div>
        </div>

        {!hasData ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p style={{ fontSize: '11pt' }}>No observation forms submitted during this period.</p>
            <p style={{ fontSize: '9pt', marginTop: '8px' }}>Adjust the date range above or submit observation forms from the student&apos;s record.</p>
          </div>
        ) : (
          <>
            {/* Executive Summary */}
            <SectionHeader title="Executive Summary" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <StatBox label="Practitioner Events" value={eventLogs.length} />
              <StatBox label="Family Episodes" value={familyLogs.length} />
              <StatBox label="Energy Logs" value={energyLogs.length} />
              <StatBox label="Total Observations" value={totalEvents + energyLogs.length} />
            </div>

            {/* Trend */}
            {eventLogs.length > 1 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '9.5pt', marginBottom: '12px' }}>
                <strong>Practitioner-observed event trend: </strong>
                {trendLabel(earlyEvents.length, lateEvents.length)}
                {lateEvents.length < earlyEvents.length && <span style={{ color: '#15803d', fontWeight: 'bold' }}> — Positive trend</span>}
                {lateEvents.length > earlyEvents.length && <span style={{ color: '#b91c1c', fontWeight: 'bold' }}> — Monitor closely</span>}
              </div>
            )}
            {familyLogs.length > 1 && trendLabel(earlyFamily.length, lateFamily.length) && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px 14px', fontSize: '9.5pt', marginBottom: '12px' }}>
                <strong>Family-reported episode trend: </strong>
                {trendLabel(earlyFamily.length, lateFamily.length)}
                {lateFamily.length < earlyFamily.length && <span style={{ color: '#15803d', fontWeight: 'bold' }}> — Positive trend</span>}
                {lateFamily.length > earlyFamily.length && <span style={{ color: '#b91c1c', fontWeight: 'bold' }}> — Monitor closely</span>}
              </div>
            )}
            {avgAccDiff !== null && (
              <div style={{ background: avgAccDiff < -5 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${avgAccDiff < -5 ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '9.5pt', marginBottom: '12px' }}>
                <strong>Spelling accuracy during events: </strong>
                {Math.abs(avgAccDiff) <= 5
                  ? 'Post-event accuracy remained near baseline — minimal motor impact observed'
                  : avgAccDiff < 0
                  ? `Post-event accuracy averaged ${Math.abs(avgAccDiff).toFixed(0)}% below baseline — motor impact on spelling output observed`
                  : `Post-event accuracy averaged ${avgAccDiff.toFixed(0)}% above baseline`}
              </div>
            )}

            {/* Practitioner Event Logs */}
            {eventLogs.length > 0 && (
              <>
                <SectionHeader title="Practitioner-Observed Events" color="#1e3a5f" />

                {/* Pattern summary */}
                {(gazeFreq.length > 0 || responseFreq.length > 0 || bodyFreq.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    {gazeFreq.length > 0 && (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Gaze / Eyes</div>
                        {gazeFreq.slice(0, 5).map(([v, n]) => (
                          <div key={v} style={{ fontSize: '8.5pt', display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f9fafb' }}>
                            <span style={{ color: '#374151' }}>{v}</span>
                            <span style={{ fontWeight: 'bold', color: '#1e3a5f' }}>{n}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {responseFreq.length > 0 && (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Responsiveness</div>
                        {responseFreq.slice(0, 5).map(([v, n]) => (
                          <div key={v} style={{ fontSize: '8.5pt', display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f9fafb' }}>
                            <span style={{ color: '#374151' }}>{v}</span>
                            <span style={{ fontWeight: 'bold', color: '#1e3a5f' }}>{n}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {bodyFreq.length > 0 && (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Body / Motor</div>
                        {bodyFreq.slice(0, 5).map(([v, n]) => (
                          <div key={v} style={{ fontSize: '8.5pt', display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f9fafb' }}>
                            <span style={{ color: '#374151' }}>{v}</span>
                            <span style={{ fontWeight: 'bold', color: '#1e3a5f' }}>{n}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* After-event patterns */}
                {afterFreq.length > 0 && (
                  <div style={{ marginBottom: '14px', fontSize: '9pt' }}>
                    <strong>Most common post-event observations: </strong>
                    {afterFreq.slice(0, 4).map(([v, n]) => `${v} (${n}×)`).join(' · ')}
                  </div>
                )}

                {/* Accuracy table */}
                {accComps.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spelling Accuracy: Baseline vs Post-Event</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                          {['Date', 'Baseline %', 'Post-Event %', 'Change'].map(h => (
                            <th key={h} style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '8.5pt', color: '#374151', border: '1px solid #e5e7eb' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {accComps.map((c, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                            <td style={{ padding: '4px 10px', border: '1px solid #e5e7eb' }}>{c.date}</td>
                            <td style={{ padding: '4px 10px', border: '1px solid #e5e7eb' }}>{c.baseline}%</td>
                            <td style={{ padding: '4px 10px', border: '1px solid #e5e7eb' }}>{c.post}%</td>
                            <td style={{ padding: '4px 10px', border: '1px solid #e5e7eb', color: c.diff < -5 ? '#b91c1c' : c.diff > 5 ? '#15803d' : '#374151', fontWeight: 'bold' }}>
                              {c.diff > 0 ? '+' : ''}{c.diff.toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Individual event entries */}
                <Divider />
                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Individual Event Records</div>
                {eventLogs.map((sub, i) => (
                  <div key={sub.id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px', marginBottom: '10px', pageBreakInside: 'avoid' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#1e3a5f', marginBottom: '6px' }}>
                      Event {i + 1} — {fd(sub, 'date') || fmtTs(sub.submitted_at)}
                      {fd(sub, 'eventTimeStart') && <span style={{ fontWeight: 'normal', color: '#6b7280' }}> · {fd(sub, 'eventTimeStart')}{fd(sub, 'eventTimeEnd') ? `–${fd(sub, 'eventTimeEnd')}` : ''}</span>}
                      {fd(sub, 'eventDuration') && <span style={{ fontWeight: 'normal', color: '#6b7280' }}> · Duration: {fd(sub, 'eventDuration')}</span>}
                    </div>
                    <Row label="Activity before" value={fd(sub, 'activityBefore')} />
                    <Row label="First change noticed" value={fd(sub, 'firstObservableChange')} />
                    <Row label="Gaze / eyes" value={fa(sub, 'gazeEyes')} />
                    <Row label="Responsiveness" value={fa(sub, 'responsiveness')} />
                    <Row label="Body / motor" value={fa(sub, 'bodyMotor')} />
                    <Row label="Description" value={fd(sub, 'eventDescription')} />
                    <Row label="Time until return" value={fd(sub, 'timeUntilReturn')} />
                    <Row label="Post-event observations" value={fa(sub, 'afterEvent')} />
                    <Row label="Compared to baseline" value={fa(sub, 'comparisonObservations')} />
                    {fd(sub, 'knownQuestion') && <Row label="KNOWN question result" value={fd(sub, 'knownQuestion')} />}
                    <Row label="Additional observations" value={fd(sub, 'additionalObservations')} />
                  </div>
                ))}
              </>
            )}

            {/* Family Reports */}
            {familyLogs.length > 0 && (
              <>
                <SectionHeader title="Family-Reported Episodes" color="#6d28d9" />

                {(familyEyeFreq.length > 0 || familyMovFreq.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    {familyEyeFreq.length > 0 && (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Eyes / Gaze</div>
                        {familyEyeFreq.slice(0, 5).map(([v, n]) => (
                          <div key={v} style={{ fontSize: '8.5pt', display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f9fafb' }}>
                            <span>{v}</span><span style={{ fontWeight: 'bold', color: '#6d28d9' }}>{n}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {familyMovFreq.length > 0 && (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Movements</div>
                        {familyMovFreq.slice(0, 5).map(([v, n]) => (
                          <div key={v} style={{ fontSize: '8.5pt', display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f9fafb' }}>
                            <span>{v}</span><span style={{ fontWeight: 'bold', color: '#6d28d9' }}>{n}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {familyLogs.map((sub, i) => {
                  const mostImportant = fd(sub, 'mostImportant')
                  return (
                    <div key={sub.id} style={{ border: '1px solid #e9d5ff', borderRadius: '6px', padding: '10px 14px', marginBottom: '10px', pageBreakInside: 'avoid' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#6d28d9', marginBottom: '6px' }}>
                        Episode {i + 1} — {fd(sub, 'date') || fmtTs(sub.submitted_at)}
                        {fd(sub, 'dayOfWeek') && <span style={{ fontWeight: 'normal', color: '#6b7280' }}> ({fd(sub, 'dayOfWeek')})</span>}
                        {fd(sub, 'timeStart') && <span style={{ fontWeight: 'normal', color: '#6b7280' }}> · {fd(sub, 'timeStart')}{fd(sub, 'timeEnd') ? `–${fd(sub, 'timeEnd')}` : ''}</span>}
                        {fd(sub, 'duration') && <span style={{ fontWeight: 'normal', color: '#6b7280' }}> · {fd(sub, 'duration')}</span>}
                      </div>
                      <Row label="Reported by" value={fd(sub, 'observer')} />
                      <Row label="What child was doing" value={fd(sub, 'doingBefore')} />
                      <Row label="How child seemed" value={fa(sub, 'seemedBefore')} />
                      <Row label="Possible factors" value={fa(sub, 'factors')} />
                      <Row label="First thing noticed" value={fd(sub, 'firstNoticed')} />
                      <Row label="Eyes / gaze" value={fa(sub, 'eyes')} />
                      <Row label="Head / body" value={fa(sub, 'headBody')} />
                      <Row label="Movements" value={fa(sub, 'movements')} />
                      <Row label="Responded to name" value={fd(sub, 'respondName')} />
                      <Row label="Responded to touch" value={fd(sub, 'respondTouch')} />
                      <Row label="After episode" value={fa(sub, 'afterEpisode')} />
                      <Row label="Recovery time" value={fd(sub, 'recoveryTime')} />
                      <Row label="Recovery notes" value={fd(sub, 'recoveryNotes')} />
                      <Row label="Video recorded" value={fd(sub, 'videoRecorded')} />
                      <Row label="Happened before" value={fd(sub, 'happenedBefore')} />
                      <Row label="Episodes that day" value={fd(sub, 'episodesToday')} />
                      {mostImportant && (
                        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', padding: '8px 10px', marginTop: '6px', fontSize: '9pt' }}>
                          <strong>Most important observation: </strong>{mostImportant}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* Energy / Regulation Logs */}
            {energyLogs.length > 0 && (
              <>
                <SectionHeader title="Session Energy &amp; Regulation Tracking" color="#065f46" />
                {energyLogs.map((sub, i) => (
                  <div key={sub.id} style={{ border: '1px solid #d1fae5', borderRadius: '6px', padding: '10px 14px', marginBottom: '10px', pageBreakInside: 'avoid' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#065f46', marginBottom: '6px' }}>
                      Session {i + 1} — {fd(sub, 'sessionDate') || fmtTs(sub.submitted_at)}
                      {fd(sub, 'sessionStart') && <span style={{ fontWeight: 'normal', color: '#6b7280' }}> · {fd(sub, 'sessionStart')}{fd(sub, 'sessionEnd') ? `–${fd(sub, 'sessionEnd')}` : ''}</span>}
                    </div>
                    <Row label="Sleep / health factors" value={fa(sub, 'sleepHealth')} />
                    <Row label="Baseline energy" value={fa(sub, 'baselineEnergy')} />
                    <Row label="Baseline regulation" value={fa(sub, 'baselineRegulation')} />
                    <Row label="Baseline visual" value={fa(sub, 'baselineVisual')} />
                    <Row label="Changes observed" value={fa(sub, 'changesObserved')} />
                    <Row label="Break taken" value={fd(sub, 'breakTaken')} />
                    <Row label="Post-break outcome" value={fd(sub, 'postBreakOutcome')} />
                    <Row label="Summary notes" value={fd(sub, 'additionalObservations')} />
                  </div>
                ))}
              </>
            )}

            {/* Footer */}
            <Divider />
            <div style={{ fontSize: '8pt', color: '#9ca3af', textAlign: 'center' }}>
              Generated by Word Up S2C · worduplessongenerator.com · {generatedDate}<br />
              This document contains observations recorded by the student's S2C practitioner and family. It is not a medical diagnosis.
            </div>
          </>
        )}
      </div>
    </>
  )
}
