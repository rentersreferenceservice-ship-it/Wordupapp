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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">

          {/* Logo — prominent */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-14 w-auto rounded-lg shadow-sm" />
            <div className="hidden sm:block">
              <p className="text-lg font-black tracking-tight leading-none" style={{ color: '#1d1d1d' }}>WORD UP</p>
              <p className="text-xs font-semibold tracking-wider" style={{ color: '#C9A435' }}>SPELLING TO COMMUNICATE</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden xl:flex items-center gap-5">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === l.href
                    ? 'font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                style={pathname === l.href ? { color: '#C9A435' } : {}}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden xl:flex items-center gap-2">
            <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors">
              Lesson Generator
            </a>
            <a href="/practitioner/get-started"
              className="text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
              style={{ background: '#1d1d1d', color: 'white' }}>
              Practitioner Dashboard →
            </a>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="xl:hidden p-2 text-gray-700 text-xl"
            aria-label="Toggle menu">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="xl:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href ? 'font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={pathname === l.href ? { background: '#faf8f3', color: '#C9A435' } : {}}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex flex-col gap-2">
            <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
              className="text-center border-2 border-gray-200 text-gray-700 text-sm font-semibold px-5 py-3 rounded-lg">
              Lesson Generator
            </a>
            <a href="/practitioner/get-started"
              className="text-center text-sm font-bold px-5 py-3 rounded-lg"
              style={{ background: '#1d1d1d', color: 'white' }}>
              Practitioner Dashboard →
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
