import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/practitioner-services', label: 'Practitioner Services' },
  { href: '/parent-resources', label: 'Parent Resources' },
  { href: '/practice-tools', label: 'Practice Tools' },
  { href: '/practitioner-minute', label: 'Practitioner Minute' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function PublicFooter() {
  return (
    <footer style={{ background: '#111' }} className="text-white pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* Top: logo + tagline + contact */}
        <div className="grid md:grid-cols-3 gap-10 mb-10">

          {/* Logo + brand */}
          <div>
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 w-auto rounded-xl mb-4 shadow-md" />
            <p className="text-sm text-gray-400 leading-relaxed">
              Built by a practitioner.<br />
              Designed for your practice.<br />
              Created for your students.
            </p>
          </div>

          {/* Contact info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Contact</p>
            <div className="space-y-3 text-sm text-gray-300">
              <a href="tel:6033157140" className="flex items-center gap-2 hover:text-white transition-colors">
                <span>📞</span> 603-315-7140
              </a>
              <a href="mailto:wordups2c@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <span>✉️</span> wordups2c@gmail.com
              </a>
              <a href="https://www.facebook.com/WordUpS2C" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <span>📘</span> Facebook — Word Up S2C
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Quick Links</p>
            <div className="space-y-2 text-sm text-gray-400">
              <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <span>📚</span> Lesson Generator
              </a>
              <a href="https://www.worduplessongenerator.com/practitioner/dashboard" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <span>🗂️</span> Practitioner Dashboard
              </a>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="flex items-center gap-2 hover:text-white transition-colors">
                  <span className="opacity-0 text-xs">·</span> {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Word Up, LLC. All rights reserved.</p>
          <p>Spelling to Communicate · wordups2c.com</p>
        </div>
      </div>
    </footer>
  )
}
