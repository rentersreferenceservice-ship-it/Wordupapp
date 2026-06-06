'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CRP } from '@/lib/practitionerStore'

export default function CrpManager({ studentId, initialCrps }: { studentId: string; initialCrps: CRP[] }) {
  const [crps, setCrps] = useState<CRP[]>(initialCrps)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/practitioner/crps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, name: name.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setCrps(prev => [...prev, data.crp])
      setName('')
      setAdding(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/practitioner/crps/${id}`, { method: 'DELETE' })
    setCrps(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">CRPs</h2>
          <p className="text-xs text-gray-400 mt-0.5">Communication Regulation Partners</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add CRP
          </button>
        )}
      </div>

      {crps.length === 0 && !adding && (
        <p className="text-sm text-gray-400 italic">No CRPs added yet. Sessions default to practitioner.</p>
      )}

      <div className="space-y-2">
        {crps.map(crp => (
          <div key={crp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: crp.color }} />
              <span className="text-sm font-medium text-gray-800">{crp.name}</span>
            </div>
            <button
              onClick={() => handleDelete(crp.id)}
              disabled={deletingId === crp.id}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              {deletingId === crp.id ? '…' : 'Remove'}
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setName('') } }}
            placeholder="CRP name (e.g. Maria, Mom)"
            autoFocus
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !name.trim()}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '…' : 'Add'}
          </button>
          <button
            onClick={() => { setAdding(false); setName('') }}
            className="text-gray-400 hover:text-gray-600 px-2 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
