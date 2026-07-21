'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Our Philosophy' },
  { href: '/our-practice', label: 'Our Practice' },
  { href: '/practitioner-services', label: 'Services' },
  { href: '/parent-resources', label: 'Parent Resources' },
  { href: '/practice-tools', label: 'Practice Tools' },
  { href: '/reflections', label: 'Reflections' },
  { href: '/contact', label: 'Contact' },
]

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50" style={{ background: '#fdf9f4', boxShadow: '0 1px 0 rgba(90,60,30,0.08)' }}>
      {/* Masthead — logo + name side by side */}
      <div className="flex items-center justify-center py-6 relative" style={{ borderBottom: '1px solid rgba(160,128,96,0.15)' }}>
        <Link href="/" className="flex items-center gap-5">
          <img src="/word_up_clean.jpeg" alt="Word Up" className="h-24 w-auto rounded-2xl shadow-lg" />
          <div>
            <p className="font-black leading-none tracking-[0.18em]"
              style={{ color: '#2a1f17', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              WORD UP
            </p>
            <p className="font-semibold tracking-[0.35em] mt-2 uppercase"
              style={{ color: '#C9A435', fontSize: 'clamp(0.6rem, 1.2vw, 0.8rem)' }}>
              Spelling to Communicate
            </p>
          </div>
        </Link>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setOpen(o => !o)}
          className="xl:hidden absolute right-5 p-2 text-xl"
          style={{ color: '#8a7060' }}
          aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Nav links row — desktop */}
      <nav className="hidden xl:flex items-center justify-center gap-7 py-3.5" style={{ background: '#fdf9f4' }}>
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href}
            className="text-sm transition-all whitespace-nowrap"
            style={pathname === l.href
              ? { color: '#C9A435', fontWeight: '700' }
              : { color: '#7a6a5a', fontWeight: '500' }}>
            {l.label}
          </Link>
        ))}
        <a href="https://worduplessongenerator.com/practitioner/get-started"
          className="text-xs font-semibold px-5 py-2.5 rounded-full transition-all hover:opacity-90 ml-3"
          style={{ background: '#2a1f17', color: '#f5efe6', letterSpacing: '0.05em' }}>
          Practitioner Dashboard
        </a>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="xl:hidden" style={{ borderTop: '1px solid rgba(160,128,96,0.15)', background: '#fdf9f4' }}>
          <div className="px-5 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm transition-colors"
                style={pathname === l.href
                  ? { background: '#f0e8dc', color: '#C9A435', fontWeight: '700' }
                  : { color: '#5a4a3a', fontWeight: '500' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="px-5 pb-5 pt-2" style={{ borderTop: '1px solid rgba(160,128,96,0.12)' }}>
            <a href="https://worduplessongenerator.com/practitioner/get-started"
              className="block text-center text-sm font-semibold px-5 py-3.5 rounded-full"
              style={{ background: '#2a1f17', color: '#f5efe6' }}>
              Practitioner Dashboard
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
