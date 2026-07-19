import Link from 'next/link'
import PublicNav from './components/PublicNav'

export const metadata = {
  title: 'Word Up — Practice Tools for S2C Practitioners',
  description: 'Spend less time managing your practice. More time supporting your students. Word Up provides practical tools created by a practitioner for Spelling to Communicate practitioners.',
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 60%, #4c1d95 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-40 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-amber-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8">
              Built by a Certified S2C Practitioner
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Spend Less Time<br />Managing Your Practice.
            </h1>
            <h2 className="text-2xl md:text-3xl font-light mb-8" style={{ color: '#F0C84A' }}>
              More Time Supporting Your Students.
            </h2>
            <p className="text-lg text-purple-200 mb-10 max-w-2xl leading-relaxed">
              Word Up provides practical tools created by a practitioner to simplify lesson planning, documentation, communication, and practice management for Spelling to Communicate practitioners.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/practice-tools"
                className="font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl hover:scale-105"
                style={{ background: '#D4AF37', color: '#1a0540' }}>
                Explore Practice Tools
              </Link>
              <Link href="/practitioner-services"
                className="border-2 border-white/30 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all">
                Learn About Practitioner Services
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom, transparent, #fffbf0)' }} />
      </section>

      {/* Built by a Practitioner */}
      <section className="py-20" style={{ background: '#fffbf0' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-5" style={{ color: '#1a0540' }}>Built by a Practitioner</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              Word Up wasn&apos;t created by software developers looking for a market. It was built one tool at a time while supporting students and families. Every feature exists because it solved a real problem encountered in practice.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🧩',
                title: 'Created in Practice',
                body: 'Every tool began as a solution to a real challenge — from lesson prep to progress tracking to family communication.',
              },
              {
                icon: '📊',
                title: 'Objective Data',
                body: 'Automatic accuracy calculations, visual graphs, and shareable transcripts replace guesswork with evidence.',
              },
              {
                icon: '💛',
                title: 'Designed for Your Students',
                body: 'Less administrative burden means more energy for what matters — the student sitting in front of you.',
              },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-2xl p-8 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-5">{card.icon}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1a0540' }}>{card.title}</h3>
                <p className="text-gray-600 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* From Heavy to Lighter */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a0540' }}>From Heavy to Lighter.</h2>
            <p className="text-2xl font-semibold" style={{ color: '#B8860B' }}>From Chaos to Clarity.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🎒</div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Before</p>
                <p className="text-gray-700 font-semibold mt-1">Walking into every session carrying…</p>
              </div>
              <ul className="space-y-3">
                {['Lessons', 'Student files', 'Clipboards', 'Transcripts', 'Boards', 'Pens', 'Cameras', 'Endless paperwork'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-500 text-sm">
                    <span className="text-red-400 font-bold">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">✨</div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#D4AF37' }}>Now</p>
                <p className="text-white font-semibold mt-1">Walking in with confidence carrying…</p>
              </div>
              <ul className="space-y-3 mb-8">
                {['A tablet', 'A tripod', 'A camera'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="font-bold" style={{ color: '#D4AF37' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-purple-200 text-sm leading-relaxed border-t border-purple-700 pt-6">
                The story isn&apos;t about replacing teaching. It&apos;s about eliminating unnecessary administrative work — so you can show up fully present for every student, every session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Highlight */}
      <section className="py-20 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>The Practitioner Dashboard</p>
            <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-white">
              &ldquo;The Practitioner Dashboard is a practice management system built specifically for Spelling to Communicate practitioners.&rdquo;
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {[
              'Manage every student',
              'Track accuracy automatically',
              'Store transcripts and videos',
              'Communicate with families',
              'Invoice in seconds',
              'Run your practice with confidence',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4">
                <span className="text-lg shrink-0" style={{ color: '#D4AF37' }}>✦</span>
                <span className="text-sm font-medium text-white">{f}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a href="/practitioner/get-started"
              className="inline-block font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl hover:scale-105"
              style={{ background: '#D4AF37', color: '#1a0540' }}>
              Explore the Practitioner Dashboard →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-14" style={{ background: '#0f0226' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div>
              <img src="/word_up_clean.jpeg" alt="Word Up" className="h-12 w-auto mb-3 rounded-lg" />
              <p className="text-sm" style={{ color: '#9b87c8' }}>Built by a practitioner. Designed for your practice.</p>
              <p className="text-sm mt-1" style={{ color: '#9b87c8' }}>Created for your students.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm" style={{ color: '#9b87c8' }}>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/practitioner-services" className="hover:text-white transition-colors">Practitioner Services</Link>
              <Link href="/parent-resources" className="hover:text-white transition-colors">Parent Resources</Link>
              <Link href="/practice-tools" className="hover:text-white transition-colors">Practice Tools</Link>
              <Link href="/practitioner-minute" className="hover:text-white transition-colors">Practitioner Minute</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: '#2d1a5c', color: '#6b5a9a' }}>
            <p>© {new Date().getFullYear()} Word Up, LLC. All rights reserved.</p>
            <a href="mailto:wordups2c@gmail.com" className="transition-colors hover:text-amber-400">wordups2c@gmail.com</a>
          </div>
        </div>
      </footer>
    </>
  )
}
