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

type ModalMode = 'create' | 'edit'
interface ModalState {
  mode: ModalMode
  date: string
  appointment?: Appointment
}

const EMPTY_FORM = {
  studentName: '',
  studentId: '',
  time: '09:00',
  durationMinutes: 50,
  travelBefore: 0,
  travelAfter: 0,
  notes: '',
  recurrence: 'none' as 'none' | 'weekly' | 'biweekly',
  occurrences: 26,
}

export default function CalendarClient({ students, initialAppointments, initialYear, initialMonth }: {
  students: Student[]
  initialAppointments: Appointment[]
  initialYear: number
  initialMonth: number
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth) // 1-indexed
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [studentSearch, setStudentSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Appointment | null>(null)
  const [error, setError] = useState('')

  // Assign consistent colors to each student name
  const colorMap = useMemo(() => {
    const map = new Map<string, typeof COLORS[0]>()
    let idx = 0
    const sorted = [...new Set(appointments.map(a => a.student_name))].sort()
    for (const name of sorted) {
      map.set(name, COLORS[idx % COLORS.length])
      idx++
    }
    return map
  }, [appointments])

  function colorFor(name: string) {
    if (!colorMap.has(name)) return COLORS[0]
    return colorMap.get(name)!
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Group appointments by date string
  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const a of appointments) {
      if (!map[a.appointment_date]) map[a.appointment_date] = []
      map[a.appointment_date].push(a)
    }
    return map
  }, [appointments])

  const dateStr = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  async function fetchMonth(y: number, m: number) {
    setLoading(true)
    const res = await fetch(`/api/practitioner/appointments?month=${y}-${String(m).padStart(2, '0')}`)
    const data = await res.json()
    setAppointments(data.appointments ?? [])
    setLoading(false)
  }

  function prevMonth() {
    const newM = month === 1 ? 12 : month - 1
    const newY = month === 1 ? year - 1 : year
    setMonth(newM); setYear(newY)
    fetchMonth(newY, newM)
  }

  function nextMonth() {
    const newM = month === 12 ? 1 : month + 1
    const newY = month === 12 ? year + 1 : year
    setMonth(newM); setYear(newY)
    fetchMonth(newY, newM)
  }

  function goToday() {
    const t = new Date()
    setYear(t.getFullYear()); setMonth(t.getMonth() + 1)
    fetchMonth(t.getFullYear(), t.getMonth() + 1)
  }

  function openCreate(d: number) {
    setForm({ ...EMPTY_FORM })
    setStudentSearch('')
    setError('')
    setModal({ mode: 'create', date: dateStr(d) })
  }

  function openEdit(apt: Appointment) {
    setForm({
      studentName: apt.student_name,
      studentId: apt.student_id ?? '',
      time: apt.appointment_time.slice(0, 5),
      durationMinutes: apt.duration_minutes,
      travelBefore: apt.travel_before,
      travelAfter: apt.travel_after,
      notes: apt.notes ?? '',
      recurrence: 'none',
      occurrences: 26,
    })
    setStudentSearch(apt.student_name)
    setError('')
    setModal({ mode: 'edit', date: apt.appointment_date, appointment: apt })
  }

  const filteredStudents = useCallback(() =>
    students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())),
    [students, studentSearch]
  )

  async function handleSave() {
    if (!form.studentName.trim()) { setError('Enter a student name.'); return }
    setSaving(true); setError('')
    const body = {
      studentName: form.studentName,
      studentId: form.studentId || null,
      date: modal!.date,
      time: form.time,
      durationMinutes: form.durationMinutes,
      travelBefore: form.travelBefore,
      travelAfter: form.travelAfter,
      notes: form.notes,
      recurrence: form.recurrence,
      occurrences: form.occurrences,
    }
    try {
      if (modal!.mode === 'create') {
        const res = await fetch('/api/practitioner/appointments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        // Re-fetch month to get all new entries
        await fetchMonth(year, month)
      } else {
        const apt = modal!.appointment!
        const res = await fetch(`/api/practitioner/appointments/${apt.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, date: undefined }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAppointments(prev => prev.map(a => a.id === apt.id ? data.appointment : a))
      }
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(apt: Appointment, series: boolean) {
    setDeleting(true)
    await fetch(`/api/practitioner/appointments/${apt.id}?series=${series}`, { method: 'DELETE' })
    if (series && apt.series_id) {
      setAppointments(prev => prev.filter(a => a.series_id !== apt.series_id))
    } else {
      setAppointments(prev => prev.filter(a => a.id !== apt.id))
    }
    setDeleting(false)
    setDeleteModal(null)
    setModal(null)
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <main className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors">‹</button>
          <h2 className="text-xl font-bold text-gray-900 w-52 text-center">{MONTHS[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors">›</button>
        </div>
        <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">Today</button>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center mb-3">Loading…</p>}

      {/* Student color legend */}
      {colorMap.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...colorMap.entries()].map(([name, color]) => (
            <span key={name} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color.text }} />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`empty-${idx}`} className="min-h-[110px] bg-gray-50 border-b border-r border-gray-100 last:border-r-0" />
            )
            const ds = dateStr(day)
            const apts = byDate[ds] ?? []
            const isToday = ds === todayStr
            return (
              <div
                key={ds}
                className={`min-h-[110px] border-b border-r border-gray-100 last:border-r-0 p-1.5 cursor-pointer hover:bg-blue-50 transition-colors group ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => openCreate(day)}
              >
                <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {apts.map(apt => {
                    const color = colorFor(apt.student_name)
                    const endTime = addMinutes(apt.appointment_time, apt.duration_minutes)
                    return (
                      <div key={apt.id} onClick={e => { e.stopPropagation(); openEdit(apt) }}>
                        {apt.travel_before > 0 && (
                          <div className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5 mb-0.5 border border-gray-200">
                            ↑ {apt.travel_before}min travel
                          </div>
                        )}
                        <div
                          className="text-[10px] font-semibold rounded px-1.5 py-1 leading-tight border cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                        >
                          <div className="truncate">{apt.student_name}</div>
                          <div className="font-normal opacity-80">{fmt12(apt.appointment_time.slice(0, 5))}–{fmt12(endTime)}</div>
                          <div className="font-normal opacity-70">{apt.duration_minutes}min</div>
                        </div>
                        {apt.travel_after > 0 && (
                          <div className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-0.5 mt-0.5 border border-gray-200">
                            ↓ {apt.travel_after}min travel
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {apts.length === 0 && (
                    <div className="text-[10px] text-gray-300 group-hover:text-blue-400 transition-colors mt-1">+ add</div>
                  )}
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
              <h2 className="text-base font-bold text-gray-900">
                {modal.mode === 'create' ? 'New Appointment' : 'Edit Appointment'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Date display */}
              <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm font-semibold text-blue-800">
                {new Date(modal.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>

              {/* Student */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Student</label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setForm(f => ({ ...f, studentName: e.target.value, studentId: '' })) }}
                  placeholder="Search or type a name…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {studentSearch.length > 0 && filteredStudents().length > 0 && (
                  <div className="border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm">
                    {filteredStudents().slice(0, 5).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, studentName: s.name, studentId: s.id })); setStudentSearch(s.name) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                      >
                        {s.name} <span className="text-gray-400 text-xs">{s.ageGroup}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duration</label>
                <div className="flex gap-2">
                  {[50, 100].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${form.durationMinutes === d ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel time */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Travel Time (minutes)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Before session</p>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={form.travelBefore}
                      onChange={e => setForm(f => ({ ...f, travelBefore: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">After session</p>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={form.travelAfter}
                      onChange={e => setForm(f => ({ ...f, travelAfter: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Location, reminders…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Recurrence — only on create */}
              {modal.mode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Repeat</label>
                  <div className="flex gap-2 mb-2">
                    {(['none', 'weekly', 'biweekly'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, recurrence: r }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-colors capitalize ${form.recurrence === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                      >
                        {r === 'none' ? 'None' : r === 'weekly' ? 'Weekly' : 'Biweekly'}
                      </button>
                    ))}
                  </div>
                  {form.recurrence !== 'none' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Occurrences:</label>
                      <input
                        type="number"
                        min="1"
                        max="104"
                        value={form.occurrences}
                        onChange={e => setForm(f => ({ ...f, occurrences: parseInt(e.target.value) || 1 }))}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <span className="text-xs text-gray-400">sessions</span>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2">
              {modal.mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => { setDeleteModal(modal.appointment!); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Add Appointment' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete appointment?</h3>
            <p className="text-sm text-gray-500 mb-5">
              {deleteModal.student_name} — {new Date(deleteModal.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {fmt12(deleteModal.appointment_time.slice(0, 5))}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDelete(deleteModal, false)}
                disabled={deleting}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete this appointment'}
              </button>
              {deleteModal.series_id && (
                <button
                  onClick={() => handleDelete(deleteModal, true)}
                  disabled={deleting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  Delete entire series
                </button>
              )}
              <button
                onClick={() => setDeleteModal(null)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
