'use client'

import { useEffect, useRef, useState } from 'react'
import { youtubeSearchUrl } from '@/lib/qrcode'

export default function VaktVideoQR({
  qrDataUrl,
  videoId,
  searchQuery,
  description,
  duration,
  videoTitle,
}: {
  qrDataUrl: string
  videoId?: string
  searchQuery?: string
  description?: string
  duration?: string
  videoTitle?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleClick() {
    if (!videoId) {
      window.open(youtubeSearchUrl(searchQuery ?? ''), '_blank', 'noopener,noreferrer')
      return
    }
    setOpen(true)
    // Best-effort true fullscreen where the browser allows it — the overlay
    // itself still fills the screen even when this is unavailable/denied.
    requestAnimationFrame(() => {
      containerRef.current?.requestFullscreen?.().catch(() => {})
    })
  }

  function handleClose() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setOpen(false)
  }

  return (
    <>
      <button type="button" onClick={handleClick} className="block mx-auto">
        <img src={qrDataUrl} alt="YouTube QR — click to open the video" width={80} height={80} className="hover:opacity-80 transition-opacity" />
        <p className="text-[7pt] text-blue-500 font-semibold mt-0.5 leading-tight">▶ Click to play</p>
      </button>

      {open && videoId && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300 z-10"
            title="Close"
          >
            ✕
          </button>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={videoTitle || 'YouTube video'}
            className="w-full h-full max-w-6xl max-h-[90vh] aspect-video"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )}

      {description && <p className="text-[7pt] text-gray-600 mt-0.5 leading-tight">{description}</p>}
      {duration && videoTitle && (
        <p className="text-[7pt] text-gray-400 mt-0.5 leading-tight">{duration} — {videoTitle}</p>
      )}
    </>
  )
}
