'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/practitioner-services', label: 'Practitioner Services' },
  { href: '/parent-resources', label: 'Parent Resources' },
  { href: '/practice-tools', label: 'Practice Tools' },
  { href: '/practitioner-minute', label: 'Practitioner Minute' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-10 w-auto" />
          </Link>

          <div className="hidden xl:flex items-center gap-5">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === l.href
                    ? 'text-purple-900 font-semibold'
                    : 'text-gray-600 hover:text-purple-900'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-2">
            <a href="/practitioner/get-started"
              className="text-sm font-medium text-gray-600 hover:text-purple-900 px-3 py-2 transition-colors">
              Log In
            </a>
            <a href="/practitioner/get-started"
              className="bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              Get Started →
            </a>
          </div>

          <button
            onClick={() => setOpen(o => !o)}
            className="xl:hidden p-2 text-gray-700 text-xl leading-none"
            aria-label="Toggle menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'bg-purple-50 text-purple-900 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 flex flex-col gap-2">
            <a href="/practitioner/get-started"
              className="text-center bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
              Get Started →
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
