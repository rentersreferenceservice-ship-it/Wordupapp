'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { StudentReportData, SavedReport } from '@/lib/practitionerStore'

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

function Section({ title, visible, onDelete, children }: { title: string; visible: boolean; onDelete: () => void; children: React.ReactNode }) {
  if (!visible) return null
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 relative group">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</h2>
        <button onClick={onDelete} className="no-print opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-lg leading-none transition-opacity" title="Remove section">×</button>
      </div>
      {children}
    </div>
  )
}

export default function ReportClient({
  studentId,
  studentName,
  savedReports,
  loadedReport,
}: {
  studentId: string
  studentName: string
  savedReports: SavedReport[]
  loadedReport: SavedReport | null
}) {
  const today = new Date().toISOString().split('T')[0]
  const yearStart = today.slice(0, 4) + '-01-01'
  const [startDate, setStartDate] = useState(loadedReport?.startDate ?? getQuarterRange(-1).start)
  const [endDate, setEndDate] = useState(loadedReport?.endDate ?? getQuarterRange(-1).end)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(!!loadedReport)

  const [reportId, setReportId] = useState<string | null>(loadedReport?.id ?? null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | ''>(loadedReport ? 'saved' : '')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showSavedList, setShowSavedList] = useState(false)
  const [localSavedReports, setLocalSavedReports] = useState<SavedReport[]>(savedReports)

  const sc = loadedReport?.sectionsContent ?? {}
  const [milestonesText, setMilestonesText] = useState(sc.milestones ?? '')
  const [regulationText, setRegulationText] = useState(sc.regulation ?? '')
  const [lettersText, setLettersText] = useState(sc.letters ?? '')
  const [narrative, setNarrative] = useState(loadedReport?.narrative ?? '')
  const [goals, setGoals] = useState(loadedReport?.goals ?? '')
  const [finSessions, setFinSessions] = useState(sc.finSessions ?? '')
  const [finFrequency, setFinFrequency] = useState(sc.finFrequency ?? 'Twice weekly')
  const [finRate, setFinRate] = useState(sc.finRate ?? '')
  const [finTotal, setFinTotal] = useState(sc.finTotal ?? '')
  const [statAvg, setStatAvg] = useState(sc.statAvg ?? '')
  const [statProgress, setStatProgress] = useState(sc.statProgress ?? '')
  const [statBest, setStatBest] = useState(sc.statBest ?? '')
  const [statSessions, setStatSessions] = useState(sc.statSessions ?? '')

  const sv = loadedReport?.sectionsVisible ?? {}
  const [show, setShow] = useState({
    stats: sv.stats !== false,
    milestones: sv.milestones !== false,
    regulation: sv.regulation !== false,
    letters: sv.letters !== false,
    financials: sv.financials !== false,
    narrative: sv.narrative !== false,
    goals: sv.goals !== false,
  })
  const hide = (key: keyof typeof show) => setShow(prev => ({ ...prev, [key]: false }))

  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')

  const reportDataRef = useRef<StudentReportData | null>(loadedReport?.reportData ?? null)

  const buildSavePayload = useCallback(() => ({
    startDate,
    endDate,
    narrative,
    goals,
    sectionsContent: { milestones: milestonesText, regulation: regulationText, letters: lettersText, finSessions, finFrequency, finRate, finTotal, statAvg, statProgress, statBest, statSessions },
    sectionsVisible: show,
    reportData: reportDataRef.current,
    existingId: reportId ?? undefined,
  }), [startDate, endDate, narrative, goals, milestonesText, regulationText, lettersText, finSessions, finFrequency, finRate, finTotal, statAvg, statProgress, statBest, statSessions, show, reportId])

  const autoSave = useCallback(async () => {
    if (!reportDataRef.current) return
    setSaveStatus('saving')
    const payload = buildSavePayload()
    try {
      const res = await fetch(`/api/practitioner/report/${studentId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (res.ok && d.id) {
        const isNew = !payload.existingId
        setReportId(d.id)
        setSaveStatus('saved')
        if (isNew) {
          const newEntry = {
            id: d.id,
            startDate: payload.startDate,
            endDate: payload.endDate,
            createdAt: new Date().toISOString(),
            narrative: payload.narrative,
            goals: payload.goals,
            sectionsContent: payload.sectionsContent,
            sectionsVisible: payload.sectionsVisible,
            reportData: reportDataRef.current!,
          }
          setLocalSavedReports(prev => [newEntry, ...prev])
        }
      } else {
        setSaveStatus('unsaved')
      }
    } catch {
      setSaveStatus('unsaved')
    }
  }, [studentId, buildSavePayload])

  useEffect(() => {
    if (!generated) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('unsaved')
    saveTimerRef.current = setTimeout(autoSave, 2000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestonesText, regulationText, lettersText, narrative, goals, finSessions, finFrequency, finRate, finTotal, statAvg, statProgress, statBest, statSessions, show])

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setGenerated(false)
    setReportId(null)
    setSaveStatus('')
    try {
      const res = await fetch(`/api/practitioner/report/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to generate report'); setLoading(false); return }

      const rd: StudentReportData = data.reportData
      reportDataRef.current = rd

      const fmt = (n: number | null) => n !== null ? `${n}%` : '—'
      setStatSessions(rd.accuracyTrend.completedCount.toString())
      setStatAvg(fmt(rd.accuracyTrend.average))
      setStatProgress(`${fmt(rd.accuracyTrend.first)} → ${fmt(rd.accuracyTrend.last)}`)
      setStatBest(fmt(rd.accuracyTrend.highest))

      const mLines = [
        ...rd.boardMilestones.map(m => `• Advanced to ${m.board} — ${new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`),
        ...rd.questionTypeMilestones.map(m => `• ${m.type} introduced — ${new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`),
      ]
      setMilestonesText(mLines.length ? mLines.join('\n') : 'No new milestones recorded this period.')
      setShow(prev => ({ ...prev, milestones: mLines.length > 0 }))

      const reg = rd.regulationStats
      const rLines: string[] = []
      if (reg.arrivedRegulated > 0) rLines.push(`• Arrived regulated: ${reg.arrivedRegulated} sessions`)
      if (reg.improvedByEnd > 0) rLines.push(`• Arrived dysregulated, self-regulated by end: ${reg.improvedByEnd} sessions ✓`)
      if (reg.ongoingConcern > 0) rLines.push(`• Dysregulated full session: ${reg.ongoingConcern} sessions`)
      setRegulationText(rLines.length ? rLines.join('\n') : 'No regulation data recorded this period.')
      setShow(prev => ({ ...prev, regulation: rLines.length > 0 }))

      setLettersText(rd.topMisspokedLetters.length
        ? rd.topMisspokedLetters.map(l => l.letter).join('  ·  ')
        : 'No letter misspoke data for this period.')
      setShow(prev => ({ ...prev, letters: rd.topMisspokedLetters.length > 0 }))

      const periodDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1
      const periodWeeks = Math.max(1, periodDays / 7)
      const annualProjectedSessions = Math.round(rd.financials.completedSessions * (52 / periodWeeks))
      const rate = rd.financials.sessionRate
      const projectedAnnualTotal = rate != null && annualProjectedSessions > 0 ? (annualProjectedSessions * rate).toFixed(2) : ''

      setFinSessions(rd.financials.completedSessions.toString())
      setFinRate(rate != null ? rate.toString() : '')
      setFinFrequency('Twice weekly')
      setFinTotal(projectedAnnualTotal)

      setNarrative(data.narrative)
      setGoals(data.goals)
      setGenerated(true)
      // Trigger first save directly — state closure won't have updated yet
      setSaveStatus('saving')
      fetch(`/api/practitioner/report/${studentId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate,
          narrative: data.narrative,
          goals: data.goals,
          sectionsContent: { milestones: mLines.join('\n'), regulation: rLines.join('\n'), letters: rd.topMisspokedLetters.map((l: { letter: string }) => l.letter).join('  ·  '), finSessions: rd.financials.completedSessions.toString(), finFrequency: 'Twice weekly', finRate: rd.financials.sessionRate?.toString() ?? '', finTotal: projectedAnnualTotal, statAvg: fmt(rd.accuracyTrend.average), statProgress: `${fmt(rd.accuracyTrend.first)} → ${fmt(rd.accuracyTrend.last)}`, statBest: fmt(rd.accuracyTrend.highest), statSessions: rd.accuracyTrend.completedCount.toString() },
          sectionsVisible: { stats: true, milestones: mLines.length > 0, regulation: rLines.length > 0, letters: rd.topMisspokedLetters.length > 0, financials: true, narrative: true, goals: true },
          reportData: rd,
        }),
      }).then(r => r.json()).then(d => {
        if (d.id) {
          setReportId(d.id)
          setSaveStatus('saved')
          setLocalSavedReports(prev => [{ id: d.id, startDate, endDate, createdAt: new Date().toISOString(), narrative: data.narrative, goals: data.goals, sectionsContent: {}, sectionsVisible: {}, reportData: rd }, ...prev])
        } else { setSaveStatus('unsaved') }
      }).catch(() => setSaveStatus('unsaved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generating report')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteReport(id: string) {
    const res = await fetch(`/api/practitioner/report/${studentId}/save`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setLocalSavedReports(prev => prev.filter(r => r.id !== id))
      if (id === reportId) { setReportId(null); setSaveStatus('') }
    }
  }

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e.includes('@')) return
    if (!emailList.includes(e)) setEmailList(prev => [...prev, e])
    setEmailInput('')
  }

  async function handleSend() {
    if (!emailList.length) return
    setSending(true)
    setSendStatus('')
    try {
      const res = await fetch(`/api/practitioner/report/${studentId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate, emails: emailList,
          sections: { milestonesText, regulationText, lettersText, narrative, goals, finSessions, finFrequency, finRate, finTotal, statAvg, statProgress, statBest, statSessions, show },
          studentName,
        }),
      })
      const d = await res.json()
      setSendStatus(res.ok ? 'Sent!' : ('Error: ' + (d.error ?? 'Send failed')))
    } catch {
      setSendStatus('Error sending')
    } finally {
      setSending(false)
    }
  }

  const periodLabel = startDate && endDate
    ? `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : ''

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } textarea, input { border: none !important; outline: none !important; resize: none; background: transparent !important; padding: 0 !important; } }`}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <Link href={`/practitioner/students/${studentId}`} className="text-sm text-blue-600 hover:underline">← {studentName}</Link>
        <h1 className="text-xl font-bold text-gray-900">Progress Report</h1>
        {saveStatus === 'saving' && <span className="text-xs text-gray-400 ml-auto">Saving…</span>}
        {saveStatus === 'saved' && <span className="text-xs text-green-600 ml-auto">✓ Saved</span>}
        {saveStatus === 'unsaved' && <span className="text-xs text-yellow-500 ml-auto">Unsaved changes</span>}
      </div>

      {/* Saved reports list */}
      {localSavedReports.length > 0 && (
        <div className="no-print mb-5">
          <button onClick={() => setShowSavedList(v => !v)} className="text-xs text-blue-600 hover:underline font-semibold">
            {showSavedList ? '▾' : '▸'} {localSavedReports.length} saved report{localSavedReports.length !== 1 ? 's' : ''}
          </button>
          {showSavedList && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
              {localSavedReports.map(r => {
                const pl = `${new Date(r.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(r.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pl}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/practitioner/students/${studentId}/report?load=${r.id}`} className="text-xs text-blue-600 hover:underline font-semibold">Open</Link>
                      <button onClick={() => handleDeleteReport(r.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Date range picker */}
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

      {generated && !loading && (
        <div>
          <div className="hidden print:block mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Word Up S2C — Progress Report</p>
            <h1 className="text-2xl font-bold text-gray-900">{studentName}</h1>
            <p className="text-sm text-gray-500">{periodLabel}</p>
          </div>

          <p className="text-xs text-gray-400 mb-4 no-print">All sections are editable. Hover a section to delete it.</p>

          {/* Stats */}
          {show.stats && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 relative group">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Accuracy Summary</h2>
                <button onClick={() => hide('stats')} className="no-print opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-lg leading-none transition-opacity">×</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Sessions', value: statSessions, set: setStatSessions, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Avg Accuracy', value: statAvg, set: setStatAvg, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Progress', value: statProgress, set: setStatProgress, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                  { label: 'Best Session', value: statBest, set: setStatBest, color: 'text-purple-700', bg: 'bg-purple-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <input value={s.value} onChange={e => s.set(e.target.value)} className={`w-full text-center text-xl font-bold ${s.color} bg-transparent focus:outline-none`} />
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Section title="Milestones This Period" visible={show.milestones} onDelete={() => hide('milestones')}>
            <textarea value={milestonesText} onChange={e => setMilestonesText(e.target.value)} rows={Math.max(2, milestonesText.split('\n').length + 1)} className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </Section>

          <Section title="Regulation" visible={show.regulation} onDelete={() => hide('regulation')}>
            <textarea value={regulationText} onChange={e => setRegulationText(e.target.value)} rows={Math.max(2, regulationText.split('\n').length + 1)} className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </Section>

          <Section title="Most Misspoked Letters" visible={show.letters} onDelete={() => hide('letters')}>
            <input value={lettersText} onChange={e => setLettersText(e.target.value)} className="w-full text-sm font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 tracking-widest" />
            <p className="text-xs text-gray-400 mt-1">Approximated from misspoked words — edit as needed</p>
          </Section>

          {show.financials && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 relative group">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Session & Funding Summary</h2>
                <button onClick={() => hide('financials')} className="no-print opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-lg leading-none transition-opacity">×</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Sessions Completed', value: finSessions, set: setFinSessions, prefix: '' },
                  { label: 'Frequency', value: finFrequency, set: setFinFrequency, prefix: '' },
                  { label: 'Session Rate', value: finRate, set: setFinRate, prefix: '$' },
                  { label: 'Projected Annual Total', value: finTotal, set: setFinTotal, prefix: '$' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {f.prefix && <span className="text-lg font-bold text-gray-700">{f.prefix}</span>}
                      <input value={f.value} onChange={e => f.set(e.target.value)} className="w-full text-center text-lg font-bold text-gray-800 bg-transparent focus:outline-none" placeholder="—" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {show.narrative && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4 relative group">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wide">Progress Narrative</h2>
                <button onClick={() => hide('narrative')} className="no-print opacity-0 group-hover:opacity-100 text-blue-200 hover:text-red-400 text-lg leading-none transition-opacity">×</button>
              </div>
              <textarea value={narrative} onChange={e => setNarrative(e.target.value)} rows={8} className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            </div>
          )}

          {show.goals && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 relative group">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide">Recommended Goals</h2>
                <button onClick={() => hide('goals')} className="no-print opacity-0 group-hover:opacity-100 text-green-200 hover:text-red-400 text-lg leading-none transition-opacity">×</button>
              </div>
              <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={6} className="w-full bg-white border border-green-200 rounded-lg p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>
          )}

          <div className="no-print space-y-4">
            <button onClick={() => window.print()} className="w-full bg-gray-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors">
              Print / Save as PDF
            </button>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Email Report</h2>
              <div className="flex gap-2 mb-3">
                <input type="email" placeholder="recipient@example.com" value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={addEmail} className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Add</button>
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
              <button onClick={handleSend} disabled={sending || !emailList.length}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {sending ? 'Sending…' : `Send to ${emailList.length} recipient${emailList.length !== 1 ? 's' : ''}`}
              </button>
              {sendStatus && <p className={`text-sm mt-2 ${sendStatus.startsWith('Error') ? 'text-red-500' : 'text-green-600 font-semibold'}`}>{sendStatus}</p>}
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-6 print:mt-4">Generated by Word Up S2C Lesson Generator · worduplessongenerator.com</p>
        </div>
      )}
    </main>
  )
}
