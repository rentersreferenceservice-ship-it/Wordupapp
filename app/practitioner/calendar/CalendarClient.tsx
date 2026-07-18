'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { Student } from '@/lib/practitionerStore'

interface Appointment {
  id: string
  student_id: string | null
  student_name: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  travel_before: number
  travel_after: number
  notes: string | null
  series_id: string | null
  skipped: boolean
  skip_notes: string | null
}

interface SkippedRecord {
  id: string
  student_name: string
  appointment_date: string
  appointment_time: string
  skip_notes: string | null
}

const COLORS = [
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  { bg: '#cffafe', text: '#155e75', border: '#67e8f9' },
  { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  { bg: '#fdf4ff', text: '#86198f', border: '#e879f9' },
  { bg: '#ecfdf5', text: '#064e3b', border: '#6ee7b7' },
  { bg: '#fff1f2', text: '#9f1239', border: '#fda4af' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

type ModalMode = 'create' | 'edit'
interface ModalState { mode: ModalMode; date: string; appointment?: Appointment }

const EMPTY_FORM = {
  studentName: '', studentId: '',
  time: '09:00', durationMinutes: 50,
  travelBefore: 0, travelAfter: 0,
  notes: '',
  recurrence: 'none' as 'none' | 'weekly' | 'biweekly',
  skipped: false, skipNotes: '',
}

export default function CalendarClient({ students, initialAppointments, initialYear, initialMonth, allSkipped }: {
  students: Student[]
  initialAppointments: Appointment[]
  initialYear: number
  initialMonth: number
  allSkipped: SkippedRecord[]
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [skippedAll, setSkippedAll] = useState<SkippedRecord[]>(allSkipped)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [studentSearch, setStudentSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Appointment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showSkipped, setShowSkipped] = useState(false)

  const colorMap = useMemo(() => {
    const map = new Map<string, typeof COLORS[0]>()
    let idx = 0
    const names = [...new Set([...appointments, ...skippedAll].map(a => a.student_name))].sort()
    for (const name of names) { map.set(name, COLORS[idx % COLORS.length]); idx++ }
    return map
  }, [appointments, skippedAll])

  function colorFor(name: string) { return colorMap.get(name) ?? COLORS[0] }

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const a of appointments) {
      if (!map[a.appointment_date]) map[a.appointment_date] = []
      map[a.appointment_date].push(a)
    }
    return map
  }, [appointments])

  const dateStr = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // Skipped totals per student
  const skippedByStudent = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of skippedAll) {
      map[s.student_name] = (map[s.student_name] ?? 0) + 1
    }
    return map
  }, [skippedAll])

  async function fetchMonth(y: number, m: number) {
    setLoading(true)
    const res = await fetch(`/api/practitioner/appointments?month=${y}-${String(m).padStart(2, '0')}`)
    const data = await res.json()
    setAppointments(data.appointments ?? [])
    setLoading(false)
  }

  function prevMonth() {
    const nm = month === 1 ? 12 : month - 1
    const ny = month === 1 ? year - 1 : year
    setMonth(nm); setYear(ny); fetchMonth(ny, nm)
  }
  function nextMonth() {
    const nm = month === 12 ? 1 : month + 1
    const ny = month === 12 ? year + 1 : year
    setMonth(nm); setYear(ny); fetchMonth(ny, nm)
  }
  function goToday() {
    const t = new Date()
    setYear(t.getFullYear()); setMonth(t.getMonth() + 1)
    fetchMonth(t.getFullYear(), t.getMonth() + 1)
  }

  function openCreate(d: number) {
    setForm({ ...EMPTY_FORM }); setStudentSearch(''); setError('')
    setModal({ mode: 'create', date: dateStr(d) })
  }
  function openEdit(apt: Appointment) {
    setForm({
      studentName: apt.student_name, studentId: apt.student_id ?? '',
      time: apt.appointment_time.slice(0, 5),
      durationMinutes: apt.duration_minutes,
      travelBefore: apt.travel_before, travelAfter: apt.travel_after,
      notes: apt.notes ?? '',
      recurrence: 'none',
      skipped: apt.skipped, skipNotes: apt.skip_notes ?? '',
    })
    setStudentSearch(apt.student_name); setError('')
    setModal({ mode: 'edit', date: apt.appointment_date, appointment: apt })
  }

  const filteredStudents = useCallback(() =>
    students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())),
    [students, studentSearch])

  async function handleSave() {
    if (!form.studentName.trim()) { setError('Enter a student name.'); return }
    setSaving(true); setError('')
    try {
      if (modal!.mode === 'create') {
        const res = await fetch('/api/practitioner/appointments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: form.studentName, studentId: form.studentId || null,
            date: modal!.date, time: form.time,
            durationMinutes: form.durationMinutes,
            travelBefore: form.travelBefore, travelAfter: form.travelAfter,
            notes: form.notes, recurrence: form.recurrence,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        await fetchMonth(year, month)
      } else {
        const apt = modal!.appointment!
        const res = await fetch(`/api/practitioner/appointments/${apt.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: form.studentName, studentId: form.studentId || null,
            time: form.time, durationMinutes: form.durationMinutes,
            travelBefore: form.travelBefore, travelAfter: form.travelAfter,
            notes: form.notes, skipped: form.skipped, skipNotes: form.skipNotes,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAppointments(prev => prev.map(a => a.id === apt.id ? data.appointment : a))
        // Refresh skipped totals
        if (form.skipped !== apt.skipped) {
          if (form.skipped) {
            setSkippedAll(prev => [{ id: apt.id, student_name: form.studentName, appointment_date: apt.appointment_date, appointment_time: apt.appointment_time, skip_notes: form.skipNotes || null }, ...prev])
          } else {
            setSkippedAll(prev => prev.filter(s => s.id !== apt.id))
          }
        }
      }
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(apt: Appointment, mode: 'single' | 'series' | 'future') {
    setDeleting(true)
    const params = mode === 'series' ? '?series=true' : mode === 'future' ? '?future=true' : ''
    await fetch(`/api/practitioner/appointments/${apt.id}${params}`, { method: 'DELETE' })
    if (mode === 'series' && apt.series_id) {
      setAppointments(prev => prev.filter(a => a.series_id !== apt.series_id))
      setSkippedAll(prev => prev.filter(s => !appointments.find(a => a.series_id === apt.series_id && a.id === s.id)))
    } else if (mode === 'future' && apt.series_id) {
      setAppointments(prev => prev.filter(a => !(a.series_id === apt.series_id && a.appointment_date >= apt.appointment_date)))
    } else {
      setAppointments(prev => prev.filter(a => a.id !== apt.id))
      setSkippedAll(prev => prev.filter(s => s.id !== apt.id))
    }
    setDeleting(false); setDeleteModal(null); setModal(null)
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <main className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">📅 Calendar</h1>
        </div>
        {/* Skipped total badge */}
        {skippedAll.length > 0 && (
          <button onClick={() => setShowSkipped(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors">
            ⚠ {skippedAll.length} skipped / missed {showSkipped ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Skipped sessions panel */}
      {showSkipped && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-bold text-amber-800 mb-3">Skipped / Missed Sessions — All Time</h2>
          {/* Per-student totals */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(skippedByStudent).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
              const color = colorFor(name)
              return (
                <span key={name} className="text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}>
                  {name}: {count} skipped
                </span>
              )
            })}
          </div>
          {/* Full list */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {skippedAll.map(s => (
              <div key={s.id} className="flex items-start gap-3 bg-white rounded-lg px-3 py-2 border border-amber-100">
                <span className="text-xs font-bold text-amber-600 w-3 mt-0.5">⚠</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-800">{s.student_name}</span>
                  <span className="text-xs text-gray-400 ml-2">{fmtDate(s.appointment_date)} · {fmt12(s.appointment_time.slice(0, 5))}</span>
                  {s.skip_notes && <p className="text-xs text-gray-500 mt-0.5 italic">{s.skip_notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors text-lg">‹</button>
          <h2 className="text-xl font-bold text-gray-900 w-52 text-center">{MONTHS[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors text-lg">›</button>
        </div>
        <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">Today</button>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center mb-3">Loading…</p>}

      {/* Color legend */}
      {colorMap.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...colorMap.entries()].map(([name, color]) => (
            <span key={name} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color.text }} />
              {name}
              {skippedByStudent[name] ? <span className="ml-1 opacity-70">({skippedByStudent[name]} skipped)</span> : null}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="min-h-[110px] bg-gray-50 border-b border-r border-gray-100 last:border-r-0" />
            const ds = dateStr(day)
            const apts = byDate[ds] ?? []
            const isToday = ds === todayStr
            return (
              <div key={ds}
                className={`min-h-[110px] border-b border-r border-gray-100 last:border-r-0 p-1.5 cursor-pointer hover:bg-blue-50 transition-colors group ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => openCreate(day)}>
                <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day}</div>
                <div className="space-y-0.5">
                  {apts.map(apt => {
                    const color = colorFor(apt.student_name)
                    const endTime = addMinutes(apt.appointment_time.slice(0, 5), apt.duration_minutes)
                    return (
                      <div key={apt.id} onClick={e => { e.stopPropagation(); openEdit(apt) }}>
                        {apt.travel_before > 0 && !apt.skipped && (
                          <div className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5 mb-0.5 border border-gray-200">↑ {apt.travel_before}min travel</div>
                        )}
                        <div className={`text-[10px] font-semibold rounded px-1.5 py-1 leading-tight border cursor-pointer hover:opacity-80 transition-opacity ${apt.skipped ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: apt.skipped ? '#f3f4f6' : color.bg, color: apt.skipped ? '#9ca3af' : color.text, borderColor: apt.skipped ? '#e5e7eb' : color.border }}>
                          <div className={`truncate ${apt.skipped ? 'line-through' : ''}`}>{apt.student_name}</div>
                          <div className="font-normal opacity-80">{fmt12(apt.appointment_time.slice(0, 5))}–{fmt12(endTime)}</div>
                          {apt.skipped && <div className="text-[9px] font-bold text-amber-500">SKIPPED</div>}
                        </div>
                        {apt.travel_after > 0 && !apt.skipped && (
                          <div className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5 mt-0.5 border border-gray-200">↓ {apt.travel_after}min travel</div>
                        )}
                      </div>
                    )
                  })}
                  {apts.length === 0 && <div className="text-[10px] text-gray-300 group-hover:text-blue-400 transition-colors mt-1">+ add</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Appointment Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{modal.mode === 'create' ? 'New Appointment' : 'Edit Appointment'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm font-semibold text-blue-800">
                {fmtDate(modal.date)}
              </div>

              {/* Student */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Student</label>
                <input type="text" value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setForm(f => ({ ...f, studentName: e.target.value, studentId: '' })) }}
                  placeholder="Search or type a name…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {studentSearch.length > 0 && filteredStudents().length > 0 && (
                  <div className="border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm">
                    {filteredStudents().slice(0, 5).map(s => (
                      <button key={s.id} type="button"
                        onClick={() => { setForm(f => ({ ...f, studentName: s.name, studentId: s.id })); setStudentSearch(s.name) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                        {s.name} <span className="text-gray-400 text-xs">{s.ageGroup}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Start Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duration</label>
                <div className="flex gap-2">
                  {[50, 100].map(d => (
                    <button key={d} type="button" onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${form.durationMinutes === d ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Travel Time (minutes)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Before session</p>
                    <input type="number" min="0" step="5" value={form.travelBefore}
                      onChange={e => setForm(f => ({ ...f, travelBefore: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">After session</p>
                    <input type="number" min="0" step="5" value={form.travelAfter}
                      onChange={e => setForm(f => ({ ...f, travelAfter: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Location, reminders…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Recurrence — create only */}
              {modal.mode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Repeat</label>
                  <div className="flex gap-2">
                    {(['none', 'weekly', 'biweekly'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setForm(f => ({ ...f, recurrence: r }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-colors ${form.recurrence === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                        {r === 'none' ? 'No repeat' : r === 'weekly' ? 'Weekly' : 'Biweekly'}
                      </button>
                    ))}
                  </div>
                  {form.recurrence !== 'none' && (
                    <p className="text-xs text-gray-400 mt-2">Repeats indefinitely — end the series any time by opening a future occurrence and tapping "End series from here."</p>
                  )}
                </div>
              )}

              {/* Skip toggle — edit only */}
              {modal.mode === 'edit' && (
                <div className={`rounded-xl border-2 p-4 transition-colors ${form.skipped ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Mark as skipped / missed</p>
                      <p className="text-xs text-gray-500 mt-0.5">Family requested to skip, or session was missed</p>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, skipped: !f.skipped }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${form.skipped ? 'bg-amber-400' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.skipped ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {form.skipped && (
                    <textarea value={form.skipNotes} onChange={e => setForm(f => ({ ...f, skipNotes: e.target.value }))}
                      rows={2} placeholder="Reason (optional)…"
                      className="w-full mt-3 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white" />
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2 flex-wrap">
              {modal.mode === 'edit' && (
                <button type="button" onClick={() => setDeleteModal(modal.appointment!)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              )}
              <button type="button" onClick={() => setModal(null)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Add Appointment' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Delete appointment?</h3>
            <p className="text-sm text-gray-500 mb-5">
              {deleteModal.student_name} — {fmtDate(deleteModal.appointment_date)} at {fmt12(deleteModal.appointment_time.slice(0, 5))}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDelete(deleteModal, 'single')} disabled={deleting}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting…' : 'Delete this appointment only'}
              </button>
              {deleteModal.series_id && <>
                <button onClick={() => handleDelete(deleteModal, 'future')} disabled={deleting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  End series from here (delete this + all future)
                </button>
                <button onClick={() => handleDelete(deleteModal, 'series')} disabled={deleting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors">
                  Delete entire series
                </button>
              </>}
              <button onClick={() => setDeleteModal(null)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
