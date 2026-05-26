'use client'

import { useState, useEffect } from 'react'

export default function AddToHomeScreen({ variant = 'link' }: { variant?: 'link' | 'button' }) {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className={variant === 'button'
          ? 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
          : 'text-xs text-blue-600 font-medium hover:underline'}
      >
        {variant === 'button' ? '📲 Add to Home Screen' : '+ Home Screen'}
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 text-lg mb-4">Add to Home Screen</h2>

            {isIOS ? (
              <ol className="space-y-3 text-sm text-gray-700">
                <li><span className="font-semibold">1.</span> Open this page in <span className="font-semibold">Safari</span> (not Chrome)</li>
                <li><span className="font-semibold">2.</span> Tap the <span className="font-semibold">Share button</span> — the box with an arrow pointing up at the bottom of the screen</li>
                <li><span className="font-semibold">3.</span> Scroll down and tap <span className="font-semibold">Add to Home Screen</span></li>
                <li><span className="font-semibold">4.</span> Tap <span className="font-semibold">Add</span> in the top right corner</li>
              </ol>
            ) : (
              <ol className="space-y-4 text-sm text-gray-700">
                <li><span className="font-semibold">1.</span> Go to your home screen and <span className="font-semibold">long-press</span> the Word Up practitioner icon until a menu appears</li>
                <li><span className="font-semibold">2.</span> Tap <span className="font-semibold">Remove</span> or <span className="font-semibold">Uninstall</span> to delete the old shortcut</li>
                <li><span className="font-semibold">3.</span> Open the <span className="font-semibold">Chrome app</span> directly — do not tap the Word Up shortcut</li>
                <li><span className="font-semibold">4.</span> Type <span className="font-semibold text-blue-600">worduplessongenerator.com/practitioner/dashboard</span> in the address bar</li>
                <li><span className="font-semibold">5.</span> Tap the <span className="font-semibold">three dots ⋮</span> in the top right → <span className="font-semibold">Add to Home Screen</span></li>
              </ol>
            )}

            <button
              onClick={() => setShow(false)}
              className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
