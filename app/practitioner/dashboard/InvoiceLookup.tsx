'use client'

import { useState } from 'react'

type InvoiceResult = {
  id: string
  invoiceNumber: number
  studentName: string
  amount: number
  extraTotal: number
  amountPaid: number
  isPaid: boolean
  invoiceDate: string
  funderName: string
  notes: string
}

const PAYMENT_METHODS = ['Venmo', 'PayPal', 'EFA', 'Check', 'Other']

export default function InvoiceLookup() {
  const [number, setNumber] = useState('')
  const [result, setResult] = useState<InvoiceResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [searching, setSearching] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Venmo')
  const [marking, setMarking] = useState(false)
  const [marked, setMarked] = useState(false)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!number.trim()) return
    setSearching(true)
    setResult(null)
    setNotFound(false)
    setMarked(false)
    const res = await fetch(`/api/practitioner/invoice?number=${encodeURIComponent(number.trim())}`)
    setSearching(false)
    if (res.ok) {
      setResult(await res.json())
    } else {
      setNotFound(true)
    }
  }

  async function markPaid() {
    if (!result) return
    setMarking(true)
    const total = result.amount + result.extraTotal
    const notes = result.notes
      ? `${result.notes}\nPayment received via ${paymentMethod}`
      : `Payment received via ${paymentMethod}`
    const res = await fetch(`/api/practitioner/invoice/${result.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaid: true, amountPaid: total, notes }),
    })
    setMarking(false)
    if (res.ok) {
      setResult({ ...result, isPaid: true, amountPaid: total })
      setMarked(true)
    }
  }

  const total = result ? result.amount + result.extraTotal : 0
  const balanceDue = result ? Math.max(0, total - result.amountPaid) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Invoice Lookup — Record Payment</h2>
      <form onSubmit={search} className="flex gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Invoice #"
          value={number}
          onChange={e => setNumber(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-32"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Look Up'}
        </button>
      </form>

      {notFound && (
        <p className="text-sm text-red-500">Invoice not found.</p>
      )}

      {result && (
        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">Invoice #{result.invoiceNumber} — {result.studentName}</p>
              {result.funderName && <p className="text-xs text-gray-500">Billed to: {result.funderName}</p>}
              <p className="text-xs text-gray-400 mt-0.5">
                Date: {new Date(result.invoiceDate + 'T00:00:00').toLocaleDateString()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-gray-900">${total.toFixed(2)}</p>
              {result.amountPaid > 0 && !result.isPaid && (
                <p className="text-xs text-orange-500">Balance: ${balanceDue.toFixed(2)}</p>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${result.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {result.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>

          {!result.isPaid && (
            <div className="flex items-center gap-2 mt-4">
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                onClick={markPaid}
                disabled={marking}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {marking ? 'Saving...' : 'Mark Paid'}
              </button>
            </div>
          )}

          {marked && (
            <p className="text-sm text-green-600 font-medium mt-2">Payment recorded via {paymentMethod}.</p>
          )}
        </div>
      )}
    </div>
  )
}
