'use client'

import { useEffect, useState } from 'react'
import { generateQRDataUrl, youtubeSearchUrl, youtubeVideoUrl } from '@/lib/qrcode'

// Tapping opens the video on YouTube in a new window, so the student can
// watch it while the lesson or session stays open here. (Playing it inside
// the page failed for the many videos that block embedding on other sites.)
// Pass qrDataUrl when it was made on the server; otherwise it's made here.
export default function VaktVideoQR({
  qrDataUrl,
  videoId,
  searchQuery,
  description,
  duration,
  videoTitle,
}: {
  qrDataUrl?: string
  videoId?: string
  searchQuery?: string
  description?: string
  duration?: string
  videoTitle?: string
}) {
  const [qr, setQr] = useState<string | undefined>(qrDataUrl)

  useEffect(() => {
    if (qrDataUrl || (!videoId && !searchQuery)) return
    generateQRDataUrl(videoId, searchQuery).then(setQr).catch(() => {})
  }, [qrDataUrl, videoId, searchQuery])

  if (!videoId && !searchQuery) return null
  const url = videoId ? youtubeVideoUrl(videoId) : youtubeSearchUrl(searchQuery ?? '')

  function handleClick() {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button type="button" onClick={handleClick} className="block mx-auto" title="Open the video in a new window">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="YouTube QR — tap to open the video in a new window" width={80} height={80} className="hover:opacity-80 transition-opacity" />
        )}
        <p className="text-[7pt] text-blue-500 font-semibold mt-0.5 leading-tight">▶ Tap to play</p>
      </button>
      {description && <p className="text-[7pt] text-gray-600 mt-0.5 leading-tight">{description}</p>}
      {duration && videoTitle && (
        <p className="text-[7pt] text-gray-400 mt-0.5 leading-tight">{duration} — {videoTitle}</p>
      )}
    </>
  )
}
