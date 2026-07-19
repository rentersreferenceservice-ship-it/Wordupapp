import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'

export const metadata = {
  title: 'About — Word Up',
  description: 'Word Up was built by an experienced Certified S2C Practitioner. The mission has always been simple: more time for your students.',
}

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>About</p>
          <h1 className="text-4xl md:text-5xl font-bold">The Story Behind Word Up</h1>
        </div>
      </section>

      {/* Story with Melody's real photo */}
      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-1">
              <div className="sticky top-28">
                <img
                  src="/481072609_122154518738367665_7170235168370591795_n.jpg"
                  alt="Melody — Certified S2C Practitioner and Founder of Word Up"
                  className="w-full rounded-2xl shadow-lg object-cover"
                />
                <div className="mt-4 text-center">
                  <p className="font-bold text-lg" style={{ color: '#1d1d1d' }}>Melody</p>
                  <p className="text-sm text-gray-500">Certified S2C Practitioner</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#C9A435' }}>Founder, Word Up LLC</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6 text-gray-700 leading-relaxed text-lg">
              <p>
                Word Up grew directly from everyday practice. As an experienced Certified Spelling to Communicate Practitioner, I found myself spending more and more time on administrative work — planning lessons, documenting sessions, tracking progress, communicating with families — and less time doing the work that actually matters.
              </p>
              <p>
                So I started building tools. Not because I set out to create a software company, but because I needed solutions to real problems I was facing in my own practice every single day.
              </p>
              <p>
                One tool led to another. A lesson generator became a lesson library. A session tracker became an accuracy graph. Notes became transcripts. Transcripts became documentation. Documentation became a complete practice management system.
              </p>
              <p>
                Word Up was never built to impress investors or capture a market. It was built one feature at a time, in between sessions, because my students deserved a practitioner who could walk in the door with everything organized and every moment available for them.
              </p>
              <blockquote className="border-l-4 pl-6 py-2 italic font-medium" style={{ borderColor: '#C9A435', color: '#333' }}>
                &ldquo;I wasn&apos;t looking for software. I was looking for a better way to support my students.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#C9A435' }}>The Mission</p>
          <h2 className="text-2xl md:text-3xl font-bold leading-relaxed mb-8">
            Help practitioners spend less time managing paperwork and more time supporting students.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              'Built by a practitioner.',
              'Designed for your practice.',
              'Created for your students.',
            ].map(line => (
              <div key={line} className="rounded-xl px-5 py-4" style={{ background: '#2d2d2d' }}>
                <p className="text-sm font-medium text-white">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1d1d1d' }}>What Word Up Stands For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '📊', title: 'Objective Data', body: 'Real progress is measured. Every session, every student, every poke tracked with precision.' },
              { icon: '🤝', title: 'Real Progress', body: 'We document what students actually do — not what we hope they\'ll eventually do.' },
              { icon: '✅', title: 'Evidence Over Assumption', body: 'Every tool is grounded in the principles of S2C practice, not guesswork.' },
              { icon: '💛', title: 'Students First', body: 'Every design decision comes back to one question: does this give practitioners more time to teach?' },
            ].map(v => (
              <div key={v.title} className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="text-3xl shrink-0">{v.icon}</div>
                <div>
                  <h3 className="font-bold mb-2" style={{ color: '#1d1d1d' }}>{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
