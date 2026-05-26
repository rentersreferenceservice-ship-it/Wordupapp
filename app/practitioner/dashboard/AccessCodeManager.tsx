'use client'

import { useState, useEffect } from 'react'

interface CodeData {
  id: string
  code: string
  is_active: boolean
}

interface Redemption {
  email: string
  joinedAt: string | null
  active: boolean
}

export default function AccessCodeManager() {
  const [codeData, setCodeData] = useState<CodeData | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/practitioner/codes').then(r => r.json()),
      fetch('/api/practitioner/codes/redemptions').then(r => r.json()),
    ]).then(([codeRes, redemptionRes]) => {
      setCodeData(codeRes.code ?? null)
      setRedemptions(redemptionRes.redemptions ?? [])
      setLoading(false)
    })
  }, [])

  async function generateCode() {
    if (!confirm(codeData ? 'This will deactivate your current code. All clients will need to use the new link. Continue?' : 'Generate a client access code?')) return
    setWorking(true)
    await fetch('/api/practitioner/codes', { method: 'POST' })
    const newCode = await fetch('/api/practitioner/codes').then(r => r.json())
    setCodeData(newCode.code)
    setWorking(false)
  }

  async function toggleActive() {
    if (!codeData) return
    setWorking(true)
    await fetch('/api/practitioner/codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeId: codeData.id, isActive: !codeData.is_active }),
    })
    setCodeData({ ...codeData, is_active: !codeData.is_active })
    setWorking(false)
  }

  function copyLink() {
    if (!codeData) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${codeData.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Client Access Code</h2>
      <p className="text-xs text-gray-400 mb-4">Share this link with families so they can create a free account with subscriber access.</p>

      {!codeData ? (
        <button
          onClick={generateCode}
          disabled={working}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Generate Access Code
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${codeData.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {codeData.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="font-mono font-bold text-gray-800 tracking-widest text-lg">{codeData.code}</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 truncate flex-1">
              {window.location.origin}/join/{codeData.code}
            </span>
            <button
              onClick={copyLink}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleActive}
              disabled={working}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${codeData.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
            >
              {codeData.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
            <button
              onClick={generateCode}
              disabled={working}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Generate new code
            </button>
          </div>
        </div>
      )}

      {/* Families with access */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Families with Access
          {redemptions.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-gray-400">({redemptions.length})</span>
          )}
        </h3>
        {redemptions.length === 0 ? (
          <p className="text-xs text-gray-400">No families have joined yet.</p>
        ) : (
          <ul className="space-y-2">
            {redemptions.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate text-xs">{r.email}</span>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {r.joinedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(r.joinedAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
