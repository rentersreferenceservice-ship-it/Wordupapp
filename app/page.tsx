import Link from 'next/link'
import PublicNav from './components/PublicNav'

export const metadata = {
  title: 'Word Up — Spelling to Communicate Practice Tools',
  description: 'Every student deserves the opportunity to communicate. Every practitioner deserves tools that make that work easier.',
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function Letterboard() {
  return (
    <div className="rounded-2xl p-6 shadow-inner" style={{ background: '#1a0540' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#D4AF37' }}>
        Stencil Letterboard
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {LETTERS.map(l => (
          <div key={l}
            className="aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all"
            style={{ background: '#2d1060', color: '#e8dcc8', border: '1px solid #3d1f80' }}>
            {l}
          </div>
        ))}
        {/* Numbers row */}
        {['1','2','3','4','5','6','7'].map(n => (
          <div key={n}
            className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: '#241050', color: '#9b87c8', border: '1px solid #3d1f80' }}>
            {n}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        {['8','9','0'].map(n => (
          <div key={n}
            className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: '#241050', color: '#9b87c8', border: '1px solid #3d1f80' }}>
            {n}
          </div>
        ))}
        <div className="flex-[3] h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: '#D4AF37', color: '#1a0540' }}>
          SPACE
        </div>
      </div>
      <p className="text-center mt-4 text-xs leading-relaxed" style={{ color: '#6b5a9a' }}>
        Every student has something to say.
      </p>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #faf7f2 0%, #f0ead8 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-28">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <div className="mb-8">
                <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 w-auto rounded-xl shadow-sm mb-6" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ color: '#1a0540', lineHeight: '1.15' }}>
                Every student deserves the opportunity to communicate.
              </h1>
              <p className="text-lg md:text-xl leading-relaxed mb-4" style={{ color: '#4a3060' }}>
                Every practitioner deserves tools that make that work easier.
              </p>
              <p className="text-gray-600 leading-relaxed mb-3">
                I built Word Up because I needed it — not to start a software company, but because I wanted to spend less time managing my practice and more time supporting my students.
              </p>
              <p className="text-sm font-semibold mb-10" style={{ color: '#8b7355' }}>
                — Melody, Certified S2C Practitioner &amp; Founder
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/practice-tools"
                  className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
                  style={{ background: '#1a0540', color: 'white' }}>
                  Explore the Tools
                </Link>
                <Link href="/about"
                  className="font-semibold px-8 py-4 rounded-xl text-base border-2 transition-all hover:bg-white/60"
                  style={{ borderColor: '#c4b49a', color: '#4a3060' }}>
                  Our Story
                </Link>
              </div>
            </div>

            {/* Letterboard visual */}
            <div>
              <Letterboard />
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>The Story</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1a0540' }}>It started with a very heavy bag.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="space-y-5 text-gray-600 leading-relaxed">
              <p>For years, I arrived at every session carrying a bag so heavy it had become part of my identity as a practitioner. Lesson plans. Student binders. Clipboards. Transcripts. Cameras. Extra pens. Paperwork. Always more paperwork.</p>
              <p>Every lesson I taught generated more to organize. Every student I supported added more to carry. Every evening ended with documentation.</p>
              <p>I wasn&apos;t looking for software. I was looking for a better way to support my students.</p>
              <p>So I started building tools. One tool became two. Two became ten. And those tools, built one at a time to solve real problems I was actually facing, became Word Up.</p>
              <p className="text-base font-semibold" style={{ color: '#1a0540' }}>Today I walk into sessions carrying little more than a tablet, my camera, and a tripod.</p>
              <p>Not because technology replaced my practice. Because it removed the barriers that kept me from being fully present for my students.</p>
            </div>

            <div className="space-y-4">
              {/* Before card */}
              <div className="rounded-2xl p-6 border border-gray-100" style={{ background: '#faf7f2' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">1</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Before</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { icon: '📁', label: 'Student binders' },
                    { icon: '📋', label: 'Lesson plans' },
                    { icon: '📷', label: 'Camera' },
                    { icon: '✏️', label: 'Clipboards & pens' },
                    { icon: '📄', label: 'Transcripts' },
                    { icon: '🗂️', label: 'Paperwork' },
                  ].map(i => (
                    <div key={i.label} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs text-gray-500 border border-gray-100">
                      <span>{i.icon}</span>{i.label}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 italic">And always more to add.</p>
              </div>

              {/* After card */}
              <div className="rounded-2xl p-6" style={{ background: '#1a0540' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#D4AF37', color: '#1a0540' }}>2</div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#D4AF37' }}>Now</p>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: '📱', label: 'A tablet' },
                    { icon: '🎬', label: 'A tripod' },
                    { icon: '📷', label: 'A camera' },
                  ].map(i => (
                    <div key={i.label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#2d1060' }}>
                      <span className="text-xl">{i.icon}</span>
                      <span className="text-sm font-medium text-white">{i.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-5 leading-relaxed" style={{ color: '#9b87c8' }}>
                  Not because technology replaced the practice. Because it removed the barriers that kept me from being fully present.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What S2C is */}
      <section className="py-20" style={{ background: '#faf7f2' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>Spelling to Communicate</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#1a0540' }}>The software is never the hero.</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>Every student presumed competent. Every session structured, intentional, and built on evidence. Every transcript shared honestly with families.</p>
                <p>Word Up was built around one belief: every minute spent searching for paperwork is one less minute spent supporting a student.</p>
                <p>The students are the story. The practitioners are the story. The communication journey is the story.</p>
                <p className="font-medium" style={{ color: '#4a3060' }}>Word Up simply makes that journey a little lighter.</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { icon: '📊', label: 'Objective Data', sub: 'Real progress, honestly measured' },
                  { icon: '🎯', label: 'Real Progress', sub: 'Every session documented' },
                  { icon: '💛', label: 'More Time', sub: 'For the student in front of you' },
                ].map(v => (
                  <div key={v.label} className="bg-white rounded-xl p-4 border border-purple-50 text-center shadow-sm">
                    <div className="text-2xl mb-2">{v.icon}</div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#1a0540' }}>{v.label}</p>
                    <p className="text-xs text-gray-400 leading-tight">{v.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual panel */}
            <div className="md:col-span-2">
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#1a0540' }}>
                <div className="p-5 border-b" style={{ borderColor: '#2d1060' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#D4AF37' }}>Session in progress</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { q: 'What do plants need to grow?', type: 'KNOWN', color: '#16a34a' },
                    { q: 'Name two things the text says about photosynthesis.', type: 'SEMI-OPEN', color: '#ea580c' },
                    { q: 'How many chromosomes do humans have?', type: 'MATH', color: '#7c3aed' },
                    { q: 'What would you say if you could spell anything right now?', type: 'OPEN', color: '#db2777' },
                  ].map(item => (
                    <div key={item.q} className="rounded-lg p-3" style={{ background: '#2d1060' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: item.color }}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 leading-snug">{item.q}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: '#D4AF37' }}>
                    <span className="text-xs font-bold" style={{ color: '#1a0540' }}>Session Accuracy</span>
                    <span className="text-lg font-bold" style={{ color: '#1a0540' }}>94%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="py-20 text-white" style={{ background: '#1a0540' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>The Practitioner Dashboard</p>
              <blockquote className="text-xl md:text-2xl font-semibold leading-relaxed mb-8">
                &ldquo;A practice management system built specifically for Spelling to Communicate practitioners.&rdquo;
              </blockquote>
              <div className="space-y-3 mb-10">
                {[
                  { icon: '📋', text: 'Prepares lessons' },
                  { icon: '🎯', text: 'Documents sessions' },
                  { icon: '📈', text: 'Measures objective progress' },
                  { icon: '📁', text: 'Stores transcripts and videos' },
                  { icon: '💬', text: 'Communicates with families' },
                  { icon: '⚙️', text: 'Manages the business of practice' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-sm text-purple-200">{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-purple-300 text-sm leading-relaxed mb-8 italic">
                So practitioners can focus on what matters most. Their students.
              </p>
              <a href="/practitioner/get-started"
                className="inline-block font-bold px-8 py-4 rounded-xl text-sm transition-all hover:opacity-90"
                style={{ background: '#D4AF37', color: '#1a0540' }}>
                Start Your Free Trial →
              </a>
              <p className="text-xs mt-3" style={{ color: '#6b5a9a' }}>30-day free trial · No charge until your trial ends</p>
            </div>

            {/* Mock dashboard card */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#2d1060' }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#0f0226' }}>
                <img src="/word_up_clean.jpeg" alt="Word Up" className="h-7 w-auto rounded" />
                <span className="text-sm font-semibold text-white">Practitioner Dashboard</span>
              </div>
              <div className="p-5 space-y-3" style={{ background: '#150836' }}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Students', value: '12', color: '#3b82f6' },
                    { label: 'Sessions', value: '84', color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: '#1f0f4a' }}>
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs mt-1" style={{ color: '#9b87c8' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: '#1f0f4a' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#D4AF37' }}>Accuracy History</p>
                  <div className="flex items-end gap-1 h-16">
                    {[60, 72, 68, 80, 85, 88, 94, 91, 96, 94].map((v, i) => (
                      <div key={i} className="flex-1 rounded-t-sm transition-all"
                        style={{ height: `${v}%`, background: `rgba(212, 175, 55, ${0.4 + v / 200})` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#1f0f4a' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#9b87c8' }}>Recent Sessions</p>
                  {['Open Session · Jul 18', 'Photosynthesis · Jul 15', 'American Revolution · Jul 11'].map(s => (
                    <div key={s} className="py-1.5 border-b text-xs" style={{ borderColor: '#2d1060', color: '#6b5a9a' }}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-6xl mb-8">💛</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#1a0540' }}>Every minute matters.</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            Every minute spent searching for paperwork is one less minute supporting a student. Every feature in Word Up exists for one reason: to give that minute back.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            Not to be impressive. Not to win awards. Because the student sitting across from you deserves a practitioner who is fully there.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/practice-tools"
              className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
              style={{ background: '#1a0540', color: 'white' }}>
              Explore the Tools
            </Link>
            <Link href="/contact"
              className="font-semibold px-8 py-4 rounded-xl text-base border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#d4c5a9', color: '#4a3060' }}>
              Get in Touch
            </Link>
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
