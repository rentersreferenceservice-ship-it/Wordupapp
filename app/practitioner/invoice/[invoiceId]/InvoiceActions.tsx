'use client'

import { useState } from 'react'

interface Props {
  invoiceId: string
  initialAmountPaid: number
  initialIsPaid: boolean
  amount: number
  funderEmail: string
  guardianEmail: string
}

export default function InvoiceActions({ invoiceId, initialAmountPaid, initialIsPaid, amount: initialAmount, funderEmail, guardianEmail }: Props) {
  const [invoiceAmount, setInvoiceAmount] = useState(String(initialAmount))
  const [amountPaid, setAmountPaid] = useState(initialAmountPaid > 0 ? String(initialAmountPaid) : '')
  const [isPaid, setIsPaid] = useState(initialIsPaid)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')
  const [toEmail, setToEmail] = useState(funderEmail)
  const [ccEmail, setCcEmail] = useState(guardianEmail)
  const [showEmailForm, setShowEmailForm] = useState(false)

  async function handleSavePaid() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/practitioner/invoice/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: invoiceAmount ? parseFloat(invoiceAmount) : undefined,
        amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
        isPaid,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSendEmail() {
    setSending(true)
    setSendError('')
    const res = await fetch(`/api/practitioner/invoice/${invoiceId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funderEmail: toEmail, guardianEmail: ccEmail }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) {
      setSendError(data.error ?? 'Failed to send')
    } else {
      setSent(true)
      setShowEmailForm(false)
      setTimeout(() => setSent(false), 4000)
    }
  }

  const amount = parseFloat(invoiceAmount) || 0
  const balance = Math.max(0, amount - (parseFloat(amountPaid) || 0))

  return (
    <div className="print:hidden space-y-4 mt-6">
      {/* Paid tracking */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Payment Status</h3>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600 whitespace-nowrap">Invoice amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={invoiceAmount}
            onChange={e => setInvoiceAmount(e.target.value)}
            className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
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

        <div className="flex items-center gap-3 mb-4">
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

        <button
          onClick={handleSavePaid}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {/* Email + Print */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
        >
          {sent ? '✓ Sent' : 'Email Invoice'}
        </button>
      </div>

      {showEmailForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Send Invoice</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To (funder)</label>
            <input
              type="email"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">CC (guardian, optional)</label>
            <input
              type="email"
              value={ccEmail}
              onChange={e => setCcEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {sendError && <p className="text-xs text-red-600">{sendError}</p>}
          <button
            onClick={handleSendEmail}
            disabled={sending || !toEmail}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {sending ? 'Sending…' : 'Send Invoice'}
          </button>
        </div>
      )}
    </div>
  )
}
