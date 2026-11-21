'use client'

import { useState } from 'react'

interface Option { miles: number; label: string }

export default function InvoiceMileagePicker({ invoiceId, options, currentMiles, homeMiles, homeAdded }: {
  invoiceId: string
  options: Option[]
  currentMiles: number
  homeMiles: number | null
  homeAdded: boolean
}) {
  const [selected, setSelected] = useState(currentMiles)
  const [home, setHome] = useState(homeAdded)
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

  async function toggleHome() {
    if (saving) return
    const next = !home
    setHome(next)
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/invoice/${invoiceId}/mileage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setHome(!next)
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
      {homeMiles ? (
        <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={toggleHome}
            disabled={saving}
            className={`px-3 py-2 rounded-lg text-sm border-2 transition-colors ${
              home ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-800 hover:border-blue-400'
            }`}
          >
            {home ? `✓ Drive home added — ${homeMiles} mi` : `+ Add drive home — ${homeMiles} mi`}
          </button>
          <span className="text-xs text-blue-700">{home ? 'Tap again to remove it.' : 'Use when this was your last stop of the day.'}</span>
        </div>
      ) : (
        <p className="text-xs text-blue-700 mt-2">To add the drive home after this session, set &quot;miles home&quot; on this speller&apos;s Edit page.</p>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
