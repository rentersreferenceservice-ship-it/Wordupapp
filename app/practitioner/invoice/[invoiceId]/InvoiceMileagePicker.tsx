'use client'

import { useState } from 'react'

interface Option { miles: number; label: string }

export default function InvoiceMileagePicker({ invoiceId, options, currentMiles }: {
  invoiceId: string
  options: Option[]
  currentMiles: number
}) {
  const [selected, setSelected] = useState(currentMiles)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function choose(miles: number) {
    if (miles === selected || saving) return
    const previous = selected
    setSelected(miles)
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/invoice/${invoiceId}/mileage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miles }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setSelected(previous)
      setError('Could not save — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const choices: Option[] = [...options, { miles: 0, label: 'No mileage for this trip' }]

  return (
    <div className="print:hidden max-w-2xl mx-auto mb-6 border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
      <p className="text-sm font-semibold text-blue-900 mb-2">Mileage for this trip <span className="font-normal text-blue-700">(for your records — not shown on the invoice)</span></p>
      <div className="flex flex-wrap gap-2">
        {choices.map(o => (
          <button
            key={`${o.miles}-${o.label}`}
            type="button"
            onClick={() => choose(o.miles)}
            disabled={saving}
            className={`px-3 py-2 rounded-lg text-sm border-2 transition-colors ${
              selected === o.miles ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-800 hover:border-blue-400'
            }`}
          >
            {o.miles > 0 ? `${o.miles} mi` : ''}{o.miles > 0 && o.label ? ' — ' : ''}{o.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
