'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { StudentReportData } from '@/lib/practitionerStore'

function getQuarterRange(offset = 0): { start: string; end: string; label: string } {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + offset
  const year = now.getFullYear() + Math.floor(q / 4)
  const qn = ((q % 4) + 4) % 4
  const starts = [0, 3, 6, 9]
  const start = new Date(year, starts[qn], 1)
  const end = new Date(year, starts[qn] + 3, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `Q${qn + 1} ${year}`,
  }
}

export default function ReportClient({ studentId, studentName }: { studentId: string; studentName: string }) {
  const today = new Date().toISOString().split('T')[0]
  const yearStart = today.slice(0, 4) + '-01-01'
  const [startDate, setStartDate] = useState(getQuarterRange(-1).start)
  const [endDate, setEndDate] = useState(getQuarterRange(-1).end)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportData, setReportData] = useState<StudentReportData | null>(null)
  const [narrative, setNarrative] = useState('')
  const [goals, setGoals] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setReportData(null)
    try {
      const res = await fetch(`/api/practitioner/report/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to generate report'); return }
      setReportData(data.reportData)
      setNarrative(data.narrative)
      setGoals(data.goals)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generating report')
    } finally {
      setLoading(false)
    }
  }

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e.includes('@')) return
    if (!emailList.includes(e)) setEmailList(prev => [...prev, e])
    setEmailInput('')
  }

  async function handleSend() {
    if (!emailList.length || !reportData) return
    setSending(true)
    setSendStatus('')
    try {
      const res = await fetch(`/api/practitioner/report/${studentId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, narrative, goals, emails: emailList, startDate, endDate }),
      })
      const data = await res.json()
      if (!res.ok) { setSendStatus('Error: ' + (data.error ?? 'Send failed')); return }
      setSendStatus('Sent!')
    } catch {
      setSendStatus('Error sending email')
    } finally {
      setSending(false)
    }
  }

  const periodLabel = startDate && endDate
    ? `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : ''

  const fmt = (n: number | null) => n !== null ? `${n}%` : '—'

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <Link href={`/practitioner/students/${studentId}`} className="text-sm text-blue-600 hover:underline">← {studentName}</Link>
        <h1 className="text-xl font-bold text-gray-900">Progress Report</h1>
      </div>

      {/* Date range + preset buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 no-print">
        <p className="text-sm font-semibold text-gray-700 mb-3">Select Reporting Period</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[-3, -2, -1, 0].map(offset => {
            const q = getQuarterRange(offset)
            return (
              <button key={offset} onClick={() => { setStartDate(q.start); setEndDate(q.end) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${startDate === q.start && endDate === q.end ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                {q.label}
              </button>
            )
          })}
          <button onClick={() => { setStartDate(yearStart); setEndDate(today) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${startDate === yearStart && endDate === today ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
            Full Year {today.slice(0, 4)}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={handleGenerate} disabled={loading || !startDate || !endDate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-sm">Analyzing sessions and generating report…</p>
        </div>
      )}

      {reportData && !loading && (
        <div ref={printRef}>
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Word Up S2C — Progress Report</p>
            <h1 className="text-2xl font-bold text-gray-900">{studentName}</h1>
            <p className="text-sm text-gray-500">{periodLabel}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Sessions', value: reportData.accuracyTrend.completedCount.toString(), color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Avg Accuracy', value: fmt(reportData.accuracyTrend.average), color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Progress', value: `${fmt(reportData.accuracyTrend.first)} → ${fmt(reportData.accuracyTrend.last)}`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
              { label: 'Best Session', value: fmt(reportData.accuracyTrend.highest), color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Milestones */}
          {(reportData.boardMilestones.length > 0 || reportData.questionTypeMilestones.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Milestones This Period</h2>
              <div className="space-y-1.5">
                {reportData.boardMilestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="font-semibold text-gray-800">Advanced to {m.board}</span>
                    <span className="text-gray-400">— {new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  </div>
                ))}
                {reportData.questionTypeMilestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span className="font-semibold text-gray-800">{m.type} introduced</span>
                    <span className="text-gray-400">— {new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regulation */}
          {(reportData.regulationStats.arrivedDysregulated > 0 || reportData.regulationStats.arrivedRegulated > 0) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Regulation</h2>
              <div className="space-y-1.5 text-sm">
                {reportData.regulationStats.arrivedRegulated > 0 && (
                  <p><span className="font-semibold text-gray-800">{reportData.regulationStats.arrivedRegulated}</span> <span className="text-gray-500">sessions arrived regulated</span></p>
                )}
                {reportData.regulationStats.improvedByEnd > 0 && (
                  <p><span className="font-semibold text-green-700">{reportData.regulationStats.improvedByEnd}</span> <span className="text-gray-500">sessions: arrived dysregulated → self-regulated by end</span> <span className="text-green-600 font-semibold">✓</span></p>
                )}
                {reportData.regulationStats.ongoingConcern > 0 && (
                  <p><span className="font-semibold text-red-600">{reportData.regulationStats.ongoingConcern}</span> <span className="text-gray-500">sessions: dysregulated full session</span></p>
                )}
              </div>
            </div>
          )}

          {/* Challenging words */}
          {reportData.topMisspokedKeywords.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Most Challenging Spelling Words</h2>
              <div className="flex flex-wrap gap-2">
                {reportData.topMisspokedKeywords.map((k, i) => (
                  <span key={i} className="bg-red-50 border border-red-200 rounded-lg px-3 py-1 text-sm font-semibold text-red-700">
                    {k.keyword} <span className="text-red-400 font-normal">({k.count} misspokes)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Narrative */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Progress Narrative</h2>
            <textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              rows={8}
              className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 print:border-0 print:bg-transparent print:p-0 resize-none"
            />
          </div>

          {/* Goals */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3">Recommended Goals</h2>
            <textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              rows={6}
              className="w-full bg-white border border-green-200 rounded-lg p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400 print:border-0 print:bg-transparent print:p-0 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="no-print space-y-4">
            <button onClick={() => window.print()} className="w-full bg-gray-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors">
              Print / Save as PDF
            </button>

            {/* Email section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Email Report</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button onClick={addEmail} className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Add
                </button>
              </div>
              {emailList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {emailList.map(e => (
                    <span key={e} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium text-blue-700">
                      {e}
                      <button onClick={() => setEmailList(prev => prev.filter(x => x !== e))} className="text-blue-400 hover:text-blue-600 leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={handleSend}
                disabled={sending || !emailList.length}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {sending ? 'Sending…' : `Send to ${emailList.length || 0} recipient${emailList.length !== 1 ? 's' : ''}`}
              </button>
              {sendStatus && <p className={`text-sm mt-2 ${sendStatus.startsWith('Error') ? 'text-red-500' : 'text-green-600 font-semibold'}`}>{sendStatus}</p>}
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-6 print:mt-4">Generated by Word Up S2C Lesson Generator · worduplessongenerator.com</p>
        </div>
      )}

      {reportData && reportData.sessions.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No sessions found for this period.</p>
        </div>
      )}
    </main>
  )
}
