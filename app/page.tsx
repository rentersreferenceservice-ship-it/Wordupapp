import Link from 'next/link'
import PublicNav from './components/PublicNav'

export const metadata = {
  title: 'Word Up — Spelling to Communicate Practice Tools',
  description: 'Every student deserves the opportunity to communicate. Every practitioner deserves tools that make that work easier. Word Up was built by a practitioner, for practitioners.',
}

function PhotoPlaceholder({ label, aspect = 'aspect-video' }: { label: string; aspect?: string }) {
  return (
    <div className={`${aspect} w-full rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed`}
      style={{ background: '#f5f0e8', borderColor: '#d4c5a9' }}>
      <span className="text-3xl">📷</span>
      <p className="text-xs text-center px-4 font-medium" style={{ color: '#8b7355' }}>{label}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      {/* Hero — Melody's invitation */}
      <section className="relative" style={{ background: '#faf7f2' }}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ color: '#1a0540', lineHeight: '1.2' }}>
                Every student deserves the opportunity to communicate.
              </h1>
              <h2 className="text-xl md:text-2xl font-light mb-8 leading-relaxed" style={{ color: '#4a3060' }}>
                Every practitioner deserves tools that make that work easier.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                I built Word Up because I needed it. Not because I wanted to start a software company — but because I wanted to spend less time managing my practice and more time supporting my students.
              </p>
              <p className="text-sm font-semibold mb-8" style={{ color: '#8b7355' }}>— Melody, Certified S2C Practitioner &amp; Founder of Word Up</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/practice-tools"
                  className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90"
                  style={{ background: '#1a0540', color: 'white' }}>
                  Explore the Tools
                </Link>
                <Link href="/about"
                  className="font-semibold px-8 py-4 rounded-xl text-base border-2 transition-all hover:bg-purple-50"
                  style={{ borderColor: '#1a0540', color: '#1a0540' }}>
                  Our Story
                </Link>
              </div>
            </div>
            <div>
              <PhotoPlaceholder
                label="Melody working beside a student at the letterboard"
                aspect="aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>The Story</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-0" style={{ color: '#1a0540' }}>
              It started with a very heavy bag.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-5 text-gray-700 leading-relaxed text-base">
              <p>
                For years, I arrived at every session carrying a bag so heavy it had become part of my identity as a practitioner. Lesson plans. Student binders. Clipboards. Transcripts. Cameras. Extra pens. Paperwork. Always more paperwork.
              </p>
              <p>
                Every lesson I taught generated more to organize. Every student I supported added more to carry. Every evening ended with documentation that kept me from doing anything else.
              </p>
              <p>
                I wasn&apos;t looking for software. I was looking for a better way to support my students.
              </p>
              <p>
                So I started building tools. One tool became two. Two became ten. And those ten tools, built one at a time to solve real problems I was actually facing, became Word Up.
              </p>
              <p className="font-semibold" style={{ color: '#1a0540' }}>
                Today I walk into sessions carrying little more than a tablet, my camera, and a tripod.
              </p>
              <p>
                Not because technology replaced my practice. Because it removed the barriers that kept me from being fully present for my students.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-6 border border-gray-100" style={{ background: '#faf7f2' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Before</p>
                <PhotoPlaceholder label="The heavy bag — years of accumulated supplies" aspect="aspect-[4/3]" />
                <ul className="mt-4 space-y-2">
                  {['Lesson plans', 'Student binders', 'Clipboards & pens', 'Transcripts', 'Cameras', 'Boards', 'Endless paperwork'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="text-red-300">—</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-6 border" style={{ background: '#1a0540', borderColor: '#1a0540' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>Now</p>
                <PhotoPlaceholder label="A tablet, a tripod, and a camera — everything needed for a session" aspect="aspect-[4/3]" />
                <ul className="mt-4 space-y-2">
                  {['A tablet', 'A tripod', 'A camera'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white">
                      <span style={{ color: '#D4AF37' }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed" style={{ color: '#9b87c8' }}>
                  The story isn&apos;t about replacing teaching. It&apos;s about removing everything that was getting in the way of it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Word Up is */}
      <section className="py-20" style={{ background: '#faf7f2' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <PhotoPlaceholder label="Hands pointing to letters on a stencil letterboard" aspect="aspect-square" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>What Word Up Is</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#1a0540' }}>
                The software is never the hero.
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Word Up is a collection of practical tools built by a practitioner who needed them. Nothing was designed to sound impressive. Everything was built because it made teaching easier.
                </p>
                <p>
                  The students are the story. The practitioners are the story. The communication journey is the story.
                </p>
                <p>
                  Word Up simply makes that journey a little lighter.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                {[
                  { icon: '📋', text: 'Practical tools for every step of your workflow' },
                  { icon: '📊', text: 'Objective data that tells the real story of progress' },
                  { icon: '💛', text: 'More time — every session — for the student in front of you' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Dashboard — described as a system, not software */}
      <section className="py-20 text-white" style={{ background: '#1a0540' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>The Practitioner Dashboard</p>
              <blockquote className="text-xl md:text-2xl font-semibold leading-relaxed mb-8 text-white">
                &ldquo;The Practitioner Dashboard is a practice management system built specifically for Spelling to Communicate practitioners.&rdquo;
              </blockquote>
              <div className="space-y-3 mb-10">
                {[
                  'Prepares lessons',
                  'Documents sessions',
                  'Measures objective progress',
                  'Stores transcripts and videos',
                  'Communicates with families',
                  'Manages the business of practice',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: '#D4AF37' }}>✦</span>
                    <span className="text-sm text-purple-200">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-purple-300 text-sm leading-relaxed mb-8">
                So practitioners can focus on what matters most. Their students.
              </p>
              <a href="/practitioner/get-started"
                className="inline-block font-bold px-8 py-4 rounded-xl text-sm transition-all hover:opacity-90"
                style={{ background: '#D4AF37', color: '#1a0540' }}>
                Start Your Free Trial →
              </a>
              <p className="text-xs mt-3" style={{ color: '#6b5a9a' }}>30-day free trial · No charge until your trial ends</p>
            </div>
            <div>
              <PhotoPlaceholder label="A tablet displaying the Practitioner Dashboard during a session" aspect="aspect-[3/4]" />
            </div>
          </div>
        </div>
      </section>

      {/* Closing — hope */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="mb-10">
            <PhotoPlaceholder label="A parent smiling while reading a session transcript" aspect="aspect-[16/7]" />
          </div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#1a0540' }}>
            Every minute matters.
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            Every minute spent searching for paperwork is one less minute supporting a student. Every feature in Word Up exists for one reason: to give that minute back.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            Not to be impressive. Not to win awards. But because the student sitting across from you deserves a practitioner who is fully there.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/practice-tools"
              className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90"
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
