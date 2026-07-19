import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Our Practice — Word Up',
  description: 'Inside a Spelling to Communicate session — the letterboard, the structure, the data, and what it means for your student.',
}

export default function OurPracticePage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: '55vh' }}>
        <img
          src="/s2c-session-hero.png"
          alt="A student points to a letterboard during a Spelling to Communicate session"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(29,29,29,0.5) 0%, rgba(29,29,29,0.85) 100%)' }} />
        <div className="relative max-w-5xl mx-auto px-6 py-20 flex items-end" style={{ minHeight: '55vh' }}>
          <div className="max-w-xl pb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Our Practice</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Inside a Session
            </h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Structure, the letterboard, and what real progress looks like.
            </p>
          </div>
        </div>
      </section>

      {/* The letterboard */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="flex justify-center">
              <img
                src="/letterboard-az.jpg"
                alt="The black A-Z letterboard used in Spelling to Communicate sessions"
                className="w-full max-w-sm rounded-3xl shadow-2xl"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>The Letterboard</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#1d1d1d' }}>
                A simple tool. A profound outcome.
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  The letterboard is exactly what it looks like — letters, arranged in a grid. Nothing digital. Nothing complicated. Just a surface where a student can point to one letter at a time and build words, sentences, and eventually whole paragraphs.
                </p>
                <p>
                  For students with motor planning differences, the letterboard is a bridge. It separates the act of thinking from the act of speaking — and in doing so, it gives many students their first real opportunity to show what they know.
                </p>
                <p className="font-semibold" style={{ color: '#1d1d1d' }}>
                  We begin with simple motor warm-ups. We build complexity deliberately and carefully. And we never assume a student cannot do something before they have had the chance to try.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How a session works */}
      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A435' }}>Structure</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#1d1d1d' }}>How a Session Works</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Regulation & Motor Warm-Up',
                body: 'Every session begins with the student\'s nervous system, not the lesson. We use movement, breathing, and sensory tools to help the student arrive in their body and feel safe enough to do focused work. A regulated student is a student who can learn.',
              },
              {
                step: '02',
                title: 'Lesson Introduction',
                body: 'Each lesson is built around a topic — history, science, literature, current events — written at an appropriate level and delivered with genuine respect for the student\'s intelligence. We read. We explain. We make space for curiosity.',
              },
              {
                step: '03',
                title: 'Structured Questioning',
                body: 'Questions are scaffolded from known to open. We start with what the student already knows, move through semi-open and inferential questions, and build toward fully open questions where the student\'s own perspective and voice take center stage. Every question type has a purpose.',
              },
              {
                step: '04',
                title: 'Letterboard Spelling',
                body: 'The student points. We wait. We support the motor system without leading or prompting the answer. This is one of the most important things we do — getting out of the way so the student can show us what they actually think.',
              },
              {
                step: '05',
                title: 'Accuracy Tracking',
                body: 'Every response is tracked — correct, incorrect, or skipped. At the end of the session, an accuracy score is calculated and recorded. Over time, this data tells a clear story: not of intelligence, but of motor regulation and the steady climb toward independence.',
              },
            ].map(s => (
              <div key={s.step} className="flex gap-8 items-start bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                <div className="shrink-0 text-3xl font-black" style={{ color: '#C9A435', opacity: 0.5 }}>{s.step}</div>
                <div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#1d1d1d' }}>{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accuracy tracking story */}
      <section className="py-20 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>The Accuracy Chart</p>
              <h2 className="text-3xl font-bold mb-6">
                A chart that tells the whole story.
              </h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  When you look at a student&apos;s accuracy chart over time, you are not seeing a report card. You are seeing a map of a human nervous system learning to regulate itself.
                </p>
                <p>
                  A dip in accuracy is not failure. It is often a dysregulation event — a hard day, a change in routine, something sensory. And the climb back up tells you something powerful: the student did not give up.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  We share this chart with every family. We explain what it means. We celebrate the climb, not just the peak.
                </p>
              </div>
            </div>

            {/* Accuracy graph from the flyer */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/751113119_122228981102367665_2704634927348127284_n.jpg"
                alt="Accuracy tracking over time — a student's S2C progress chart"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What families can expect */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1d1d1d' }}>What Families Can Expect</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📊', title: 'Transparent Data', body: 'After every session, accuracy data is recorded. Families can see exactly how their student performed and how that has changed over time.' },
              { icon: '📋', title: 'Session Transcripts', body: 'Full transcripts of what was asked and how the student responded are documented and available to share with families, educators, and support teams.' },
              { icon: '🤝', title: 'Partnership', body: 'Families are not waiting-room bystanders. They are partners. We explain what we see, what it means, and how to support the work between sessions.' },
            ].map(c => (
              <div key={c.title} className="rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-5">{c.icon}</div>
                <h3 className="font-bold mb-3" style={{ color: '#1d1d1d' }}>{c.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: '#faf8f3' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1d1d1d' }}>Ready to take the first step?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Whether you&apos;re a family exploring S2C for the first time or looking for a practitioner who will take your student seriously — we&apos;d love to connect.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact"
              className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
              style={{ background: '#C9A435', color: '#1d1d1d' }}>
              Get in Touch
            </Link>
            <Link href="/practitioner-services"
              className="font-semibold px-8 py-4 rounded-xl text-base border-2 transition-all hover:bg-white"
              style={{ borderColor: '#c4b49a', color: '#444' }}>
              Our Services
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
