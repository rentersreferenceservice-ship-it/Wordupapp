'use client'

import { useState, useRef, useEffect } from 'react'
import type { Book } from '@/lib/bookStore'

export default function BookViewer({ book }: { book: Book }) {
  const totalSlides = 1 + book.pages.length
  const [index, setIndex] = useState(0)
  const [showHomeScreenTip, setShowHomeScreenTip] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])

  function next() {
    setIndex(i => Math.min(i + 1, totalSlides - 1))
  }

  function prev() {
    setIndex(i => Math.max(i - 1, 0))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [totalSlides])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -50) next()
    if (delta > 50) prev()
    touchStartX.current = null
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  const isCover = index === 0
  const page = isCover ? null : book.pages[index - 1]
  const imageUrl = isCover ? book.coverImageUrl : page?.imageUrl

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center relative select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full h-screen flex flex-col items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={isCover ? book.title : `Page ${index}`} className="max-w-full max-h-[85vh] object-contain" />
        ) : (
          <div className="text-white/50 text-sm">No image</div>
        )}

        {isCover && (
          <div className="text-center mt-4 px-6">
            <h1 className="text-white text-2xl font-bold">{book.title}</h1>
            {book.subtitle && <p className="text-white/70 text-sm mt-1">{book.subtitle}</p>}
            {book.author && <p className="text-white/50 text-xs mt-2">by {book.author}</p>}
          </div>
        )}

        {!isCover && page?.caption && (
          <div className="bg-white/95 rounded-xl px-6 py-3 mt-4 mx-6 max-w-lg text-center">
            <p className="text-gray-900 text-lg">{page.caption}</p>
          </div>
        )}
      </div>

      {/* Tap zones for navigation */}
      <button aria-label="Previous page" onClick={prev} className="absolute left-0 top-0 h-full w-1/3" />
      <button aria-label="Next page" onClick={next} className="absolute right-0 top-0 h-full w-1/3" />

      {/* Visible controls */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-10">
        <button onClick={prev} disabled={index === 0} className="bg-white/10 text-white px-3 py-2 rounded-full text-sm disabled:opacity-30">‹</button>
        <span className="text-white/50 text-xs">{index + 1} / {totalSlides}</span>
        <button onClick={next} disabled={index === totalSlides - 1} className="bg-white/10 text-white px-3 py-2 rounded-full text-sm disabled:opacity-30">›</button>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={() => setShowHomeScreenTip(true)} className="bg-white/10 text-white px-3 py-1.5 rounded-full text-xs">📲 Home Screen</button>
        <button onClick={toggleFullscreen} className="bg-white/10 text-white px-3 py-1.5 rounded-full text-xs">⛶ Fullscreen</button>
      </div>

      {showHomeScreenTip && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowHomeScreenTip(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 text-lg mb-4">Add This Book to the Home Screen</h2>
            {isIOS ? (
              <ol className="space-y-3 text-sm text-gray-700">
                <li><span className="font-semibold">1.</span> Open this page in <span className="font-semibold">Safari</span></li>
                <li><span className="font-semibold">2.</span> Tap the <span className="font-semibold">Share</span> button</li>
                <li><span className="font-semibold">3.</span> Tap <span className="font-semibold">Add to Home Screen</span></li>
                <li><span className="font-semibold">4.</span> Tap <span className="font-semibold">Add</span></li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-gray-700">
                <li><span className="font-semibold">1.</span> Tap the <span className="font-semibold">⋮</span> menu in the browser</li>
                <li><span className="font-semibold">2.</span> Tap <span className="font-semibold">Add to Home Screen</span></li>
              </ol>
            )}
            <button onClick={() => setShowHomeScreenTip(false)} className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
