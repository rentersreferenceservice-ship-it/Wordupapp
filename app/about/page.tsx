import PublicNav from '../components/PublicNav'

export const metadata = {
  title: 'About — Word Up',
  description: 'Word Up was built by an experienced Certified S2C Practitioner. The mission has always been simple: more time for your students.',
}

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>About</p>
          <h1 className="text-4xl md:text-5xl font-bold">The Story Behind Word Up</h1>
        </div>
      </section>

      {/* Story */}
      <section className="py-20" style={{ background: '#fffbf0' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 rounded-full bg-purple-100 border-4 border-purple-200 flex items-center justify-center text-4xl mb-4">
              🌟
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#1a0540' }}>Melody</h2>
            <p className="text-gray-500 text-sm mt-1">Certified Spelling to Communicate Practitioner</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-gray-700 text-lg leading-relaxed">
              Word Up grew directly from everyday practice. As an experienced Certified Spelling to Communicate Practitioner, I found myself spending more and more time on administrative work — planning lessons, documenting sessions, tracking progress, communicating with families — and less time doing the work that actually matters.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              So I started building tools. Not because I set out to create a software company, but because I needed solutions to real problems I was facing in my own practice every single day.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              One tool led to another. A lesson generator became a lesson library. A session tracker became an accuracy graph. Notes became transcripts. Transcripts became documentation. Documentation became a complete practice management system.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Word Up was never built to impress investors or capture a market. It was built one feature at a time, in between sessions, because my students deserved a practitioner who could walk in the door with everything organized and every moment available for them.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#D4AF37' }}>The Mission</p>
          <h2 className="text-2xl md:text-3xl font-bold leading-relaxed mb-8">
            Help practitioners spend less time managing paperwork and more time supporting students.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              'Built by a practitioner.',
              'Designed for your practice.',
              'Created for your students.',
            ].map(line => (
              <div key={line} className="bg-white/10 border border-white/15 rounded-xl px-5 py-4">
                <p className="text-sm font-medium text-white">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1a0540' }}>What Word Up Stands For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '📊', title: 'Objective Data', body: 'Real progress is measured. Every session, every student, every poke tracked with precision.' },
              { icon: '🤝', title: 'Real Progress', body: 'We document what students actually do — not what we hope they\'ll eventually do.' },
              { icon: '🎓', title: 'Evidence Over Assumption', body: 'Every tool is grounded in the principles of S2C practice, not guesswork.' },
              { icon: '💛', title: 'Students First', body: 'Every design decision comes back to one question: does this give practitioners more time to teach?' },
            ].map(v => (
              <div key={v.title} className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-purple-100 transition-colors">
                <div className="text-3xl shrink-0">{v.icon}</div>
                <div>
                  <h3 className="font-bold mb-2" style={{ color: '#1a0540' }}>{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-10" style={{ background: '#0f0226' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#9b87c8' }}>
          <p>© {new Date().getFullYear()} Word Up, LLC. All rights reserved.</p>
          <a href="mailto:wordups2c@gmail.com" className="hover:text-amber-400 transition-colors">wordups2c@gmail.com</a>
        </div>
      </footer>
    </>
  )
}
