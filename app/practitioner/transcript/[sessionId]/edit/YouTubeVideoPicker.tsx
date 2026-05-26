'use client'

import { useState } from 'react'

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
}

export default function YouTubeVideoPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState<YouTubeVideo[] | null>(null)
  const [notConnected, setNotConnected] = useState(false)
  const [error, setError] = useState('')

  async function openPicker() {
    setOpen(true)
    if (videos !== null) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/youtube/videos')
      const data = await res.json()
      if (data.notConnected) {
        setNotConnected(true)
      } else if (data.error) {
        setError(data.error)
      } else {
        setVideos(data.videos ?? [])
      }
    } catch {
      setError('Failed to load videos.')
    } finally {
      setLoading(false)
    }
  }

  function pick(video: YouTubeVideo) {
    onSelect(`https://www.youtube.com/watch?v=${video.id}`)
    setOpen(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPicker}
        className="text-xs text-red-600 font-medium hover:underline flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-red-600 shrink-0">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.4 12 20.4 12 20.4s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
        </svg>
        Pick from YouTube
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600">Your YouTube Videos</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
          </div>

          {loading && <p className="text-xs text-gray-400 text-center py-6">Loading…</p>}

          {notConnected && (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-gray-600 mb-2">YouTube not connected.</p>
              <a href="/practitioner/dashboard" target="_blank" className="text-xs text-blue-600 underline">
                Connect on your dashboard
              </a>
            </div>
          )}

          {error && <p className="text-xs text-red-500 text-center py-4">{error}</p>}

          {videos !== null && videos.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">No videos found in your YouTube account.</p>
          )}

          {videos !== null && videos.length > 0 && (
            <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {videos.map(v => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => pick(v)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" className="w-16 h-9 rounded object-cover shrink-0 bg-gray-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{v.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(v.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
