'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  amount: string
  amount_paid: string | null
  is_paid: boolean
  extra_items?: Array<{ description: string; amount: number }> | null
}

export default function InvoicesCollapsible({ invoices, todayStr, studentId }: { invoices: Invoice[]; todayStr: string; studentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(invoices.length === 0)
  const [showNewForm, setShowNewForm] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const unpaidCount = invoices.filter(i => !i.is_paid).length

  async function handleCreate() {
    if (!amount.trim() || isNaN(parseFloat(amount))) { setError('Enter a valid amount.'); return }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, description, amount: parseFloat(amount) }),
      })
      const data = await res.json()
      if (!res.ok || !data.invoiceId) { setError(data.error ?? 'Failed to create invoice.'); setCreating(false); return }
      router.push(`/practitioner/invoice/${data.invoiceId}`)
    } catch {
      setError('Failed to create invoice.')
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          <span className="text-xs text-gray-400">{invoices.length} total</span>
          {unpaidCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              {unpaidCount} unpaid
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className="border-t border-gray-100 divide-y divide-gray-50 px-2 pb-2">
          {invoices.map(inv => {
            const extraTotal = (inv.extra_items ?? []).reduce((sum, item) => sum + (item.amount || 0), 0)
            const amount = parseFloat(inv.amount) + extraTotal
            const paid = parseFloat(inv.amount_paid ?? '0')
            const balance = Math.max(0, amount - paid)
            const overdue = !inv.is_paid && inv.due_date && inv.due_date < todayStr
            const statusLabel = inv.is_paid ? 'Paid' : overdue ? 'Overdue' : paid > 0 ? 'Partial' : 'Unpaid'
            const statusColor = inv.is_paid
              ? 'bg-green-100 text-green-700'
              : overdue
              ? 'bg-red-600 text-white'
              : paid > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-600'
            return (
              <li key={inv.id}>
                <Link href={`/practitioner/invoice/${inv.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Invoice #{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(inv.invoice_date + 'T00:00:00').toLocaleDateString()}
                      {inv.due_date ? ` · Due ${new Date(inv.due_date + 'T00:00:00').toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">${balance.toFixed(2)} due</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
                  </div>
                </Link>
              </li>
            )
          })}
          {invoices.length === 0 && (
            <li className="px-3 py-3 text-sm text-gray-400">No invoices yet.</li>
          )}
        </ul>
      )}

      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          {!showNewForm ? (
            <button
              onClick={() => setShowNewForm(true)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + New Invoice
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Invoice (no lesson attached)</p>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (e.g. Materials fee, Makeup session)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating…' : 'Create Invoice'}
                </button>
                <button
                  onClick={() => { setShowNewForm(false); setDescription(''); setAmount(''); setError('') }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
