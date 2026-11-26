'use client'

import { youtubeVideoUrl } from '@/lib/qrcode'

// Full-screen video shown ON TOP of the speller's screen. It's only a layer —
// whatever they were typing underneath stays exactly as it was, and Close
// brings it back.
export default function VideoOverlay({ videoId, title, onClose }: {
  videoId: string
  title?: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-white text-sm font-medium truncate">{title || 'Video'}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-base font-semibold hover:bg-gray-200"
        >
          ✕ Close video
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-2">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
          title={title || 'YouTube video'}
          className="w-full h-full max-w-6xl max-h-[80vh] aspect-video"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <p className="text-center text-xs text-gray-400 py-3 px-4">
        Video won&apos;t play here?{' '}
        <a href={youtubeVideoUrl(videoId)} target="_blank" rel="noopener noreferrer" className="underline text-gray-200">
          Open it on YouTube
        </a>{' '}
        — then come back to this tab when it&apos;s done.
      </p>
    </div>
  )
}
