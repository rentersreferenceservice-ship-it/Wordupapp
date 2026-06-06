'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  invoiceId: string
  studentId: string
  initialAmount: number
}

export default function InvoiceSessionFee({ invoiceId, studentId, initialAmount }: Props) {
  const [amount, setAmount] = useState(initialAmount > 0 ? String(initialAmount) : '')
  const [editing, setEditing] = useState(initialAmount === 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    setSaving(true)
    const parsed = parseFloat(amount) || 0
    await Promise.all([
      fetch(`/api/practitioner/invoice/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed }),
      }),
      fetch(`/api/practitioner/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionRate: parsed }),
      }),
    ])
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  if (editing) {
    return (
      <span className="flex items-center justify-end gap-1">
        <span className="text-gray-400 text-sm">$</span>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={handleSave}
          placeholder="0.00"
          className="w-24 text-right text-sm font-semibold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
        />
      </span>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors group"
      title="Click to edit"
    >
      {saving ? <span className="text-gray-400">Saving…</span>
        : saved ? <span className="text-green-600">✓ Saved</span>
        : (
          <span>
            ${(parseFloat(amount) || 0).toFixed(2)}
            <span className="text-gray-300 group-hover:text-blue-400 text-xs ml-1">✎</span>
          </span>
        )}
    </button>
  )
}
