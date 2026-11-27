'use client'

import type { Hunk } from '@/lib/types'
import VaktVideoQR from './VaktVideoQR'

// A short "Watch & listen" clip for a sensory-rich page — tap to open it in a
// new window, scan the QR, or send it to the speller's tablet.
export default function WatchVideoCard({ video, onSendToTablet }: {
  video: NonNullable<Hunk['watchVideo']>
  onSendToTablet?: () => void
}) {
  return (
    <div className="print:hidden mb-4 flex items-center gap-4 flex-wrap rounded-xl border-2 border-sky-200 bg-sky-50 px-4 py-3">
      <div className="shrink-0 text-center">
        <VaktVideoQR videoId={video.videoId} videoTitle={video.title} onSendToTablet={onSendToTablet} />
      </div>
      <div className="flex-1 min-w-[160px]">
        <p className="text-sm font-bold text-sky-800">📺 Watch &amp; listen</p>
        <p className="text-sm text-sky-900">{video.description}</p>
        <p className="text-xs text-sky-600 mt-0.5">{video.duration}</p>
      </div>
    </div>
  )
}
