'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateInvoiceButton({ sessionId, hasInvoice }: { sessionId: string; hasInvoice: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    const res = await fetch('/api/practitioner/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    const data = await res.json()
    if (data.invoiceId) {
      router.push(`/practitioner/invoice/${data.invoiceId}`)
    } else {
      alert(data.error ?? 'Failed to generate invoice')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="bg-green-600 text-white border-2 border-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Creating…' : hasInvoice ? '+ New Invoice' : 'Generate Invoice'}
    </button>
  )
}
