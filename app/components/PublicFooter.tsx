import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Our Philosophy' },
  { href: '/our-practice', label: 'Our Practice' },
  { href: '/practitioner-services', label: 'Services' },
  { href: '/parent-resources', label: 'Parent Resources' },
  { href: '/practice-tools', label: 'Practice Tools' },
  { href: '/practitioner-minute', label: 'Practitioner Minute' },
  { href: '/contact', label: 'Contact' },
]

export default function PublicFooter() {
  return (
    <footer style={{ background: '#2a1f17' }} className="text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-8">

        <div className="grid md:grid-cols-3 gap-12 mb-12">

          {/* Logo + soul */}
          <div>
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 w-auto rounded-2xl mb-5 shadow-lg" />
            <p className="leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              A Spelling to Communicate practice.<br />
              Rooted in presence, connection,<br />
              and the belief that every student<br />
              has something to say.
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] mb-6 font-medium" style={{ color: '#C9A435' }}>Reach Us</p>
            <div className="space-y-4 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <a href="tel:6033157140" className="block transition-colors hover:text-white">
                603-315-7140
              </a>
              <a href="mailto:wordups2c@gmail.com" className="block transition-colors hover:text-white">
                wordups2c@gmail.com
              </a>
              <a href="https://www.facebook.com/WordUpS2C" target="_blank" rel="noopener noreferrer"
                className="block transition-colors hover:text-white">
                Facebook — Word Up S2C
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] mb-6 font-medium" style={{ color: '#C9A435' }}>Explore</p>
            <div className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="block transition-colors hover:text-white">
                  {l.label}
                </Link>
              ))}
              <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
                className="block transition-colors hover:text-white">
                Lesson Generator ↗
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
          <p>© {new Date().getFullYear()} Word Up, LLC. All rights reserved.</p>
          <p>Spelling to Communicate · wordups2c.com</p>
        </div>
      </div>
    </footer>
  )
}
