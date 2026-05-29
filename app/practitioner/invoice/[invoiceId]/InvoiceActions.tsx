'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  invoiceId: string
  initialAmountPaid: number
  initialIsPaid: boolean
  amount: number
  funderName: string
  funderEmail: string
  guardianEmail: string
  invoiceDate: string
  dueDate: string | null
  sessionId: string | null
}

export default function InvoiceActions({
  invoiceId,
  initialAmountPaid,
  initialIsPaid,
  amount: initialAmount,
  funderName: initialFunderName,
  funderEmail: initialFunderEmail,
  guardianEmail: initialGuardianEmail,
  invoiceDate: initialInvoiceDate,
  dueDate: initialDueDate,
  sessionId,
}: Props) {
  const [invoiceAmount, setInvoiceAmount] = useState(String(initialAmount))
  const [funderName, setFunderName] = useState(initialFunderName)
  const [funderEmail, setFunderEmail] = useState(initialFunderEmail)
  const [guardianEmail, setGuardianEmail] = useState(initialGuardianEmail)
  const [invoiceDate, setInvoiceDate] = useState(initialInvoiceDate)
  const [dueDate, setDueDate] = useState(initialDueDate ?? '')
  const [amountPaid, setAmountPaid] = useState(initialAmountPaid > 0 ? String(initialAmountPaid) : '')
  const [isPaid, setIsPaid] = useState(initialIsPaid)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/practitioner/invoice/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: invoiceAmount ? parseFloat(invoiceAmount) : undefined,
        funderName: funderName.trim(),
        funderEmail: funderEmail.trim(),
        guardianEmail: guardianEmail.trim(),
        invoiceDate: invoiceDate || null,
        dueDate: dueDate || null,
        amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
        isPaid,
      }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/practitioner/invoice/${invoiceId}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (res.ok) {
      if (sessionId) {
        router.push(`/practitioner/transcript/${sessionId}`)
      } else {
        router.push('/practitioner/dashboard')
      }
    } else {
      alert(data.error ?? 'Failed to delete invoice')
      setConfirmDelete(false)
    }
  }

  async function handleSendEmail() {
    if (!funderEmail.trim()) {
      setSendError('Add a Bill To email address first, then save.')
      return
    }
    setSending(true)
    setSendError('')
    const res = await fetch(`/api/practitioner/invoice/${invoiceId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funderEmail: funderEmail.trim(), guardianEmail: guardianEmail.trim() }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) {
      setSendError(data.error ?? 'Failed to send')
    } else {
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    }
  }

  const amount = parseFloat(invoiceAmount) || 0
  const balance = Math.max(0, amount - (parseFloat(amountPaid) || 0))

  return (
    <div className="print:hidden space-y-4 mt-6">

      {/* Bill To */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bill To</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bill To Name</label>
          <input
            type="text"
            value={funderName}
            onChange={e => setFunderName(e.target.value)}
            placeholder="e.g. Department of Education, Insurance Co."
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bill To Email</label>
          <input
            type="email"
            value={funderEmail}
            onChange={e => setFunderEmail(e.target.value)}
            placeholder="billing@organization.org"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Guardian Email <span className="text-gray-400">(CC on email)</span></label>
          <input
            type="email"
            value={guardianEmail}
            onChange={e => setGuardianEmail(e.target.value)}
            placeholder="guardian@email.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Invoice Dates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Invoice Dates</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Due Date <span className="text-gray-400">(optional)</span></label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Session Fee */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Session Fee</h3>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-300">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={invoiceAmount}
            onChange={e => setInvoiceAmount(e.target.value)}
            placeholder="0.00"
            className="w-40 border-2 border-gray-200 rounded-lg px-3 py-2 text-xl font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Status</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={e => {
              setIsPaid(e.target.checked)
              if (e.target.checked && !amountPaid) setAmountPaid(String(amount))
            }}
            className="w-4 h-4 rounded accent-green-600"
          />
          <span className="text-sm font-medium text-gray-700">Paid in full</span>
        </label>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 whitespace-nowrap">Amount received ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={e => setAmountPaid(e.target.value)}
            placeholder="0.00"
            className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {parseFloat(amountPaid) > 0 && (
            <span className={`text-sm font-semibold ${balance === 0 ? 'text-green-600' : 'text-orange-500'}`}>
              {balance === 0 ? '✓ Paid in full' : `$${balance.toFixed(2)} remaining`}
            </span>
          )}
        </div>

      </div>

      {/* Step 1 — Save */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Step 1</p>
        <p className="text-xs text-gray-500 mb-3">Fill in the fields above, then save before emailing.</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Step 2 — Send / Print */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Step 2</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Print / Save PDF
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {sending ? 'Sending…' : sent ? '✓ Sent' : 'Email Invoice'}
          </button>
        </div>
      </div>

      {sendError && <p className="text-sm text-red-600 text-center">{sendError}</p>}

      {/* Delete */}
      <div className="border-t border-gray-100 pt-4">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Delete this invoice
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">Delete this invoice?</p>
            <p className="text-xs text-red-500">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
