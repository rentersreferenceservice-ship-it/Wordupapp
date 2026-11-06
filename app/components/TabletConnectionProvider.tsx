'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

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

  function disconnect() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setCode(null)
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
              ✓ Connected to a tablet <span className="font-mono font-semibold">{code}</span> — use &quot;Send to tablet&quot; next to any question.
            </p>
            <button onClick={disconnect} className="text-xs text-blue-600 hover:underline">Disconnect</button>
          </div>
        ) : (
          <p className="text-sm text-blue-800">
            Not connected to a tablet yet. Ask the student to open their Type to Talk screen and scan the QR code shown there with this device.
          </p>
        )}
        {sent && <p className="text-xs text-green-700 mt-1">✓ Sent to tablet: &quot;{sent}&quot;</p>}
      </div>
      {children}
    </TabletConnectionContext.Provider>
  )
}
