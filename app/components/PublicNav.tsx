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
    <header className="bg-white sticky top-0 z-50" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
      {/* Logo row — centered and prominent */}
      <div className="flex items-center justify-center py-4 border-b border-gray-100">
        <Link href="/" className="flex flex-col items-center gap-1">
          <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 w-auto rounded-xl shadow-sm" />
          <div className="text-center">
            <p className="text-base font-black tracking-widest leading-none" style={{ color: '#1d1d1d' }}>WORD UP</p>
            <p className="text-[10px] font-semibold tracking-[0.2em] mt-0.5" style={{ color: '#C9A435' }}>SPELLING TO COMMUNICATE</p>
          </div>
        </Link>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setOpen(o => !o)}
          className="xl:hidden absolute right-4 p-2 text-gray-500 text-xl"
          aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Nav links row — desktop */}
      <nav className="hidden xl:flex items-center justify-center gap-8 py-3 bg-white">
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-sm transition-colors whitespace-nowrap ${
              pathname === l.href
                ? 'font-bold'
                : 'font-medium text-gray-500 hover:text-gray-900'
            }`}
            style={pathname === l.href ? { color: '#C9A435' } : {}}>
            {l.label}
          </Link>
        ))}
        <a href="/practitioner/get-started"
          className="text-sm font-bold px-5 py-2 rounded-lg transition-colors ml-4"
          style={{ background: '#1d1d1d', color: 'white' }}>
          Dashboard →
        </a>
      </nav>

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
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <a href="/practitioner/get-started"
              className="block text-center text-sm font-bold px-5 py-3 rounded-lg"
              style={{ background: '#1d1d1d', color: 'white' }}>
              Practitioner Dashboard →
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
