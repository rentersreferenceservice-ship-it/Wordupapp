'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function YouTubeConnect({ isConnected }: { isConnected: boolean }) {
  const [disconnecting, setDisconnecting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const ytParam = searchParams.get('yt')

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch('/api/practitioner/youtube/disconnect', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-600">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.4 12 20.4 12 20.4s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">YouTube</p>
            {isConnected
              ? <p className="text-xs text-green-600 font-medium">Connected</p>
              : <p className="text-xs text-gray-400">Not connected</p>
            }
          </div>
        </div>

        {isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : (
          <a
            href="/api/practitioner/youtube/auth"
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Connect
          </a>
        )}
      </div>

      {ytParam === 'error' && (
        <p className="text-xs text-red-500 mt-3">YouTube connection failed. Please try again.</p>
      )}
      {ytParam === 'connected' && (
        <p className="text-xs text-green-600 mt-3">YouTube connected successfully.</p>
      )}
    </div>
  )
}
