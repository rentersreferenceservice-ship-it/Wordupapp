import Link from 'next/link'
import PublicNav from './components/PublicNav'
import PublicFooter from './components/PublicFooter'

export const metadata = {
  title: 'Word Up — Spelling to Communicate Practice Tools',
  description: 'Every student deserves the opportunity to communicate. Every practitioner deserves tools that make that work easier.',
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function Letterboard() {
  return (
    <div className="rounded-2xl p-5 shadow-lg" style={{ background: '#1d1d1d' }}>
      <div className="grid grid-cols-7 gap-1.5">
        {LETTERS.map(l => (
          <div key={l} className="aspect-square rounded-md flex items-center justify-center text-sm font-bold"
            style={{ background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #404040' }}>
            {l}
          </div>
        ))}
        {['1','2','3','4','5','6','7'].map(n => (
          <div key={n} className="aspect-square rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: '#252525', color: '#777', border: '1px solid #353535' }}>
            {n}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {['8','9','0'].map(n => (
          <div key={n} className="flex-1 h-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: '#252525', color: '#777', border: '1px solid #353535' }}>
            {n}
          </div>
        ))}
        <div className="flex-[3] h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: '#C9A435', color: '#1d1d1d' }}>
          SPACE
        </div>
      </div>
      <p className="text-center mt-3 text-xs italic" style={{ color: '#888' }}>Every student has something to say.</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section style={{ background: '#faf8f3' }}>
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5" style={{ color: '#1d1d1d', lineHeight: '1.15' }}>
                Every student deserves the opportunity to communicate.
              </h1>
              <p className="text-xl leading-relaxed mb-4" style={{ color: '#444' }}>
                Every practitioner deserves tools that make that work easier.
              </p>
              <p className="text-gray-500 leading-relaxed mb-3">
                I built Word Up because I needed it — not to start a software company, but because I wanted to spend less time managing my practice and more time with my students.
              </p>
              <p className="text-sm font-semibold mb-10" style={{ color: '#8b7355' }}>
                — Melody, Certified S2C Practitioner &amp; Founder
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/practice-tools"
                  className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
                  style={{ background: '#1d1d1d', color: 'white' }}>
                  Explore the Tools
                </Link>
                <Link href="/about"
                  className="font-semibold px-8 py-4 rounded-xl text-base border-2 transition-all hover:bg-white"
                  style={{ borderColor: '#c4b49a', color: '#444' }}>
                  Our Story
                </Link>
              </div>
            </div>

            {/* Real session photo */}
            <div className="relative">
              <img
                src="/527790770_122182871402367665_1240767429979072490_n.jpg"
                alt="Student spelling on a letterboard during a Spelling to Communicate session"
                className="w-full rounded-2xl shadow-xl object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl px-4 py-3"
                style={{ background: 'rgba(29,29,29,0.88)' }}>
                <p className="text-white text-sm font-medium">Spelling to Communicate in practice</p>
                <p className="text-xs mt-0.5" style={{ color: '#C9A435' }}>Every student has something to say.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A435' }}>The Story</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1d1d1d' }}>It started with a very heavy bag.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-5 text-gray-600 leading-relaxed">
              <p>For years, I arrived at every session carrying a bag so heavy it had become part of my identity as a practitioner. Lesson plans. Student binders. Clipboards. Transcripts. Cameras. Extra pens. Paperwork. Always more paperwork.</p>
              <p>Every lesson I taught generated more to organize. Every student I supported added more to carry. Every evening ended with documentation.</p>
              <p>I wasn&apos;t looking for software. I was looking for a better way to support my students.</p>
              <p>So I started building tools. One tool became two. Two became ten. And those tools, built one at a time to solve real problems I was actually facing, became Word Up.</p>
              <p className="text-base font-semibold" style={{ color: '#1d1d1d' }}>Today I walk into sessions carrying little more than a tablet, my camera, and a tripod.</p>
              <p>Not because technology replaced my practice. Because it removed the barriers that kept me from being fully present for my students.</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-6 border border-gray-100" style={{ background: '#faf8f3' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Before</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '📁', label: 'Student binders' },
                    { icon: '📋', label: 'Lesson plans' },
                    { icon: '📷', label: 'Camera' },
                    { icon: '✏️', label: 'Clipboards' },
                    { icon: '📄', label: 'Transcripts' },
                    { icon: '🗂️', label: 'Paperwork' },
                  ].map(i => (
                    <div key={i.label} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs text-gray-500 border border-gray-100">
                      <span>{i.icon}</span>{i.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: '#1d1d1d' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Now</p>
                <div className="space-y-3">
                  {[
                    { icon: '📱', label: 'A tablet' },
                    { icon: '🎬', label: 'A tripod' },
                    { icon: '📷', label: 'A camera' },
                  ].map(i => (
                    <div key={i.label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#2d2d2d' }}>
                      <span className="text-xl">{i.icon}</span>
                      <span className="text-sm font-medium text-white">{i.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-5 leading-relaxed text-gray-500">
                  Not because technology replaced the practice. Because it got out of the way of it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Letterboard + beliefs */}
      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2">
              <Letterboard />
            </div>
            <div className="md:col-span-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A435' }}>Our Beliefs. Our Promise.</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#1d1d1d' }}>The software is never the hero.</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed mb-8">
                <p>Every person is presumed competent. Every session is structured, intentional, and built on evidence. Every transcript is shared honestly with families.</p>
                <p>Word Up was built around one belief: every minute spent searching for paperwork is one less minute spent supporting a student.</p>
                <p className="font-medium" style={{ color: '#333' }}>The students are the story. The practitioners are the story. The communication journey is the story. Word Up simply makes that journey a little lighter.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '📊', label: 'Objective Data', sub: 'Real progress, honestly measured' },
                  { icon: '🎯', label: 'Real Progress', sub: 'Every session documented' },
                  { icon: '💛', label: 'More Time', sub: 'For the student in front of you' },
                ].map(v => (
                  <div key={v.label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                    <div className="text-2xl mb-2">{v.icon}</div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#1d1d1d' }}>{v.label}</p>
                    <p className="text-xs text-gray-400 leading-tight">{v.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="py-20 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>The Practitioner Dashboard</p>
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
                    <span>{item.icon}</span>
                    <span className="text-sm text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 italic">So practitioners can focus on what matters most. Their students.</p>
              <div className="flex flex-wrap gap-4">
                <a href="/practitioner/get-started"
                  className="inline-block font-bold px-8 py-4 rounded-xl text-sm transition-all hover:opacity-90"
                  style={{ background: '#C9A435', color: '#1d1d1d' }}>
                  Start Your Free Trial →
                </a>
                <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
                  className="inline-block font-bold px-8 py-4 rounded-xl text-sm border border-gray-600 hover:border-gray-400 transition-all text-white">
                  Lesson Generator →
                </a>
              </div>
              <p className="text-xs mt-3 text-gray-600">30-day free trial · No charge until your trial ends</p>
            </div>

            {/* Mock dashboard */}
            <div className="rounded-2xl overflow-hidden border border-gray-700">
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#111' }}>
                <img src="/word_up_clean.jpeg" alt="Word Up" className="h-8 w-auto rounded" />
                <span className="text-sm font-semibold text-white">Practitioner Dashboard</span>
              </div>
              <div className="p-5 space-y-3" style={{ background: '#161616' }}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Students', value: '12', color: '#3b82f6' },
                    { label: 'Sessions', value: '84', color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: '#222' }}>
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs mt-1 text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: '#222' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#C9A435' }}>Accuracy History</p>
                  <div className="flex items-end gap-1 h-16">
                    {[60,72,68,80,85,88,94,91,96,94].map((v, i) => (
                      <div key={i} className="flex-1 rounded-t-sm"
                        style={{ height: `${v}%`, background: `rgba(201,164,53,${0.3 + v/200})` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#222' }}>
                  <p className="text-xs font-semibold mb-2 text-gray-400">Recent Sessions</p>
                  {['Open Session · Jul 18','Photosynthesis · Jul 15','American Revolution · Jul 11'].map(s => (
                    <div key={s} className="py-1.5 border-b text-xs text-gray-500" style={{ borderColor: '#2d2d2d' }}>{s}</div>
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
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#1d1d1d' }}>Every minute matters.</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            Every minute spent searching for paperwork is one less minute supporting a student. Every feature in Word Up exists for one reason: to give that minute back.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            Not to be impressive. Not to win awards. Because the student sitting across from you deserves a practitioner who is fully there.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/practice-tools"
              className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
              style={{ background: '#1d1d1d', color: 'white' }}>
              Explore the Tools
            </Link>
            <Link href="/contact"
              className="font-semibold px-8 py-4 rounded-xl text-base border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#d4c5a9', color: '#444' }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
