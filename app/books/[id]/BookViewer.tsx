'use client'

import { useState, useRef, useEffect } from 'react'
import type { Book } from '@/lib/bookStore'

const FLIP_MS = 480

function PageCard({ book, index }: { book: Book; index: number }) {
  const isCover = index === 0
  const page = isCover ? null : book.pages[index - 1]
  const imageUrl = isCover ? book.coverImageUrl : page?.imageUrl

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={isCover ? book.title : `Page ${index}`} className="max-w-full max-h-[75%] object-contain rounded-lg" draggable={false} />
      ) : (
        <div className="text-gray-300 text-sm">No image</div>
      )}

      {isCover && (
        <div className="text-center mt-4 px-6">
          <h1 className="text-gray-900 text-2xl font-bold">{book.title}</h1>
          {book.subtitle && <p className="text-gray-500 text-sm mt-1">{book.subtitle}</p>}
          {book.author && <p className="text-gray-400 text-xs mt-2">by {book.author}</p>}
        </div>
      )}

      {!isCover && page?.caption && (
        <div className="mt-4 px-6 max-w-lg text-center">
          <p className="text-gray-900 text-lg">{page.caption}</p>
        </div>
      )}
    </div>
  )
}

export default function BookViewer({ book }: { book: Book }) {
  const totalSlides = 1 + book.pages.length
  const [index, setIndex] = useState(0)
  const [flip, setFlip] = useState<{ fromIndex: number; dir: 'next' | 'prev'; animate: boolean } | null>(null)
  const [showHomeScreenTip, setShowHomeScreenTip] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])

  function goTo(newIndex: number, dir: 'next' | 'prev') {
    if (flip || newIndex < 0 || newIndex > totalSlides - 1) return
    setFlip({ fromIndex: index, dir, animate: false })
    setIndex(newIndex)
    // Start the flip on the next frame so the initial (unrotated) state paints first.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setFlip(f => f ? { ...f, animate: true } : f)
    }))
  }

  function next() { goTo(index + 1, 'next') }
  function prev() { goTo(index - 1, 'prev') }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, flip])

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

  return (
    <div
      className="min-h-screen bg-stone-800 flex flex-col items-center justify-center relative select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full h-screen flex items-center justify-center p-4 sm:p-10" style={{ perspective: '1800px' }}>
        <div className="relative w-full max-w-xl" style={{ aspectRatio: '3 / 4' }}>
          {/* Current page — always flat underneath */}
          <div className="absolute inset-0">
            <PageCard book={book} index={index} />
          </div>

          {/* The outgoing page, flipping away to reveal the current one */}
          {flip && (
            <div
              className="absolute inset-0"
              style={{
                transformOrigin: flip.dir === 'next' ? 'left center' : 'right center',
                transform: flip.animate
                  ? `rotateY(${flip.dir === 'next' ? -90 : 90}deg)`
                  : 'rotateY(0deg)',
                transition: flip.animate ? `transform ${FLIP_MS}ms ease-in` : 'none',
                backfaceVisibility: 'hidden',
                boxShadow: flip.animate ? 'none' : '0 25px 50px -12px rgba(0,0,0,0.5)',
              }}
              onTransitionEnd={() => setFlip(null)}
            >
              <PageCard book={book} index={flip.fromIndex} />
            </div>
          )}
        </div>
      </div>

      {/* Tap zones for navigation */}
      <button aria-label="Previous page" onClick={prev} className="absolute left-0 top-0 h-full w-1/3 z-0" />
      <button aria-label="Next page" onClick={next} className="absolute right-0 top-0 h-full w-1/3 z-0" />

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
