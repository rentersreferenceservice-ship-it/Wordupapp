'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateInvoiceButton({ sessionId, hasInvoice, defaultRate }: { sessionId: string; hasInvoice: boolean; defaultRate?: number }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(defaultRate != null ? String(defaultRate) : '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    const res = await fetch('/api/practitioner/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, amount: amount ? parseFloat(amount) : 0 }),
    })
    const data = await res.json()
    if (data.invoiceId) {
      router.push(`/practitioner/invoice/${data.invoiceId}`)
    } else {
      alert(data.error ?? 'Failed to generate invoice')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-green-600 text-white border-2 border-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        {hasInvoice ? '+ New Invoice' : 'Generate Invoice'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-white border-2 border-green-600 rounded-lg px-3 py-1.5">
      <span className="text-sm text-gray-500">Session fee $</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="0.00"
        autoFocus
        className="w-24 text-sm font-semibold text-gray-900 focus:outline-none"
        onKeyDown={e => e.key === 'Enter' && handleGenerate()}
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Creating…' : 'Create'}
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
    </div>
  )
}
