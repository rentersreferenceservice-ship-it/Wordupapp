'use client'

import { useState, useRef } from 'react'

const CATEGORIES = ['Subscriptions', 'Insurance', 'Materials', 'Other']
const IRS_RATE = 0.70

type Expense = {
  id: string
  date: string
  category: string
  description: string
  amount: number
  receipt_url: string | null
  is_recurring: boolean
  recurring_period: string | null
}

type MileageEntry = {
  miles: number
  trip_date: string
  student_name: string | null
}

export default function ExpensesManager({
  initialExpenses,
  mileageEntries,
  yearlyIncome,
  year,
}: {
  initialExpenses: Expense[]
  mileageEntries: MileageEntry[]
  yearlyIncome: number
  year: number
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [showMileage, setShowMileage] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Subscriptions',
    description: '',
    amount: '',
    receiptUrl: '',
    isRecurring: false,
    recurringPeriod: 'monthly',
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalMiles = mileageEntries.reduce((s, e) => s + e.miles, 0)
  const mileageDeduction = totalMiles * IRS_RATE
  const netIncome = yearlyIncome - totalExpenses - mileageDeduction

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/practitioner/receipt-upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setForm(f => ({ ...f, receiptUrl: url }))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    const res = await fetch('/api/practitioner/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        receiptUrl: form.receiptUrl || null,
        isRecurring: form.isRecurring,
        recurringPeriod: form.isRecurring ? form.recurringPeriod : null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const { expense } = await res.json()
      setExpenses(prev => [expense, ...prev])
      setForm({ date: new Date().toISOString().split('T')[0], category: 'Subscriptions', description: '', amount: '', receiptUrl: '', isRecurring: false, recurringPeriod: 'monthly' })
      setShowForm(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/practitioner/expenses/${id}`, { method: 'DELETE' })
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  }

  return (
    <div className="space-y-6">
      {/* Year Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">${yearlyIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Income {year}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Expenses</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">${mileageDeduction.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Mileage deduction</p>
          <p className="text-xs text-gray-400">{totalMiles.toFixed(1)} mi @ ${IRS_RATE}/mi</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${netIncome >= 0 ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-gray-800' : 'text-orange-700'}`}>${netIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Net income</p>
        </div>
      </div>

      {/* Expense breakdown by category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Expenses by Category</p>
          <div className="space-y-1.5">
            {Object.entries(byCategory).map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="text-gray-700">{cat}</span>
                <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mileage log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <button
          onClick={() => setShowMileage(v => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <p className="text-sm font-semibold text-gray-700">
            Mileage Log — {totalMiles.toFixed(1)} miles · ${mileageDeduction.toFixed(2)} deduction
          </p>
          <span className="text-xs text-gray-400">{showMileage ? '▲ hide' : '▼ show'}</span>
        </button>
        {showMileage && (
          <div className="mt-3 space-y-1">
            {mileageEntries.length === 0 ? (
              <p className="text-xs text-gray-400">No mileage logged yet. Set a default mileage on each student profile — it auto-records when you create their invoice.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase">
                    <th className="pb-1">Date</th>
                    <th className="pb-1">Student</th>
                    <th className="pb-1 text-right">Miles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mileageEntries.map((m, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-gray-500 text-xs">{new Date(m.trip_date + 'T00:00:00').toLocaleDateString()}</td>
                      <td className="py-1.5 text-gray-700">{m.student_name ?? '—'}</td>
                      <td className="py-1.5 text-right font-medium">{m.miles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Expenses list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Expenses</p>
          <button
            onClick={() => setShowForm(v => !v)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Expense
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
                placeholder="e.g. Liability insurance, Letter tiles"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={form.isRecurring}
                onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="recurring" className="text-sm text-gray-700">Recurring cost</label>
              {form.isRecurring && (
                <select
                  value={form.recurringPeriod}
                  onChange={e => setForm(f => ({ ...f, recurringPeriod: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ml-1"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Receipt <span className="text-gray-400 font-normal">(optional — photo or PDF)</span></label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleUpload}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
              {form.receiptUrl && !uploading && <p className="text-xs text-green-600 mt-1">Receipt attached</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No expenses yet.</p>
        ) : (
          <div className="space-y-2">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{exp.description}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{exp.category}</span>
                    {exp.is_recurring && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {exp.recurring_period === 'annual' ? 'Annual' : 'Monthly'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(exp.date + 'T00:00:00').toLocaleDateString()}
                    {exp.receipt_url && (
                      <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline">View receipt</a>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">${exp.amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deleting === exp.id}
                    className="text-gray-300 hover:text-red-500 transition-colors text-xs"
                  >
                    {deleting === exp.id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
