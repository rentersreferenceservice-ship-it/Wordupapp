'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { generateQRDataUrlFromUrl } from '@/lib/qrcode'

const STORAGE_KEY = 'tt-tablet-code'

interface TabletConnectionValue {
  code: string | null
  sendQuestion: (text: string) => void
}

const TabletConnectionContext = createContext<TabletConnectionValue>({ code: null, sendQuestion: () => {} })

export function useTabletConnection() {
  return useContext(TabletConnectionContext)
}

export default function TabletConnectionProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)
  const sequenceRef = useRef(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCode(saved)
    } catch {
      // ignore — localStorage unavailable
    }
  }, [])

  useEffect(() => {
    if (!code) return
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel(`tt:${code}`, { config: { broadcast: { self: false } } })
    channel.subscribe()
    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code])

  useEffect(() => {
    if (!code) { setQrDataUrl(null); return }
    generateQRDataUrlFromUrl(`${window.location.origin}/type-to-talk/live/${code}`, 180)
      .then(setQrDataUrl)
      .catch(() => {})
  }, [code])

  // For families without a practitioner: this device makes a new code and
  // shows a QR the speller's tablet scans to open its answer screen.
  async function connectNewTablet() {
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/type-to-talk/pairing', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.code) { setCreateError('Could not set up a tablet connection — please try again.'); return }
      try { localStorage.setItem(STORAGE_KEY, data.code) } catch { /* ignore */ }
      setCode(data.code)
      setShowQr(true)
    } catch {
      setCreateError('Could not set up a tablet connection — check your internet and try again.')
    } finally {
      setCreating(false)
    }
  }

  function disconnect() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setCode(null)
    setShowQr(false)
  }

  function sendQuestion(text: string) {
    if (!channelRef.current) return
    const sequence = ++sequenceRef.current
    channelRef.current.send({ type: 'broadcast', event: 'question', payload: { sequence, questionText: text } })
    setSent(text)
    setTimeout(() => setSent(null), 2000)
  }

  return (
    <TabletConnectionContext.Provider value={{ code, sendQuestion }}>
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 print:hidden">
        {code ? (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-blue-800">
              ✓ Tablet code <span className="font-mono font-semibold">{code}</span> — tap &quot;Send&quot; next to any question to send it to the speller&apos;s tablet.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowQr(v => !v)} className="text-xs text-blue-600 hover:underline">
                {showQr ? 'Hide tablet QR code' : 'Show tablet QR code'}
              </button>
              <button onClick={disconnect} className="text-xs text-blue-600 hover:underline">Disconnect</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-blue-800">
              Want to send these questions to a speller&apos;s tablet so they can type their answers there?
            </p>
            <button
              onClick={connectNewTablet}
              disabled={creating}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {creating ? 'Setting up…' : "Connect the speller's tablet"}
            </button>
          </div>
        )}
        {createError && <p className="text-xs text-red-600 mt-1">{createError}</p>}
        {code && showQr && qrDataUrl && (
          <div className="mt-3 flex items-center gap-4 flex-wrap bg-white rounded-xl border border-blue-100 p-3">
            {/* Not a link — tapping it here would open the tablet's screen on this device instead. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code — scan with the speller's tablet camera" width={140} height={140} className="shrink-0 mx-auto" />
            <div className="flex-1 min-w-[200px] text-sm text-blue-900 space-y-1">
              <p className="font-semibold">Scan this with the speller&apos;s tablet camera</p>
              <p className="text-xs text-blue-700">Their tablet opens a Type to Talk screen that waits for your questions. Then tap &quot;Send&quot; next to any question on this page and it appears there for them to answer.</p>
              <p className="text-xs text-blue-700">Tip: bookmark that page on the tablet so you only need to scan once.</p>
            </div>
          </div>
        )}
        {sent && <p className="text-xs text-green-700 mt-1">✓ Sent to tablet: &quot;{sent}&quot;</p>}
      </div>
      {children}
    </TabletConnectionContext.Provider>
  )
}
