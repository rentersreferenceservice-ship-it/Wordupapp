import Link from 'next/link'
import PublicNav from './components/PublicNav'
import PublicFooter from './components/PublicFooter'

export const metadata = {
  title: 'Word Up — Spelling to Communicate',
  description: 'A Spelling to Communicate practice rooted in presence, connection, and the belief that every student has something to say.',
}

export default function HomePage() {
  return (
    <>
      <PublicNav />

      {/* Hero — full bleed, meditative */}
      <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>
        <img
          src="/s2c-adult-session.png"
          alt="An adult speller and practitioner work together at the letterboard in a warm, peaceful space"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Soft gradient — warm, not harsh */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(42,31,23,0.82) 0%, rgba(42,31,23,0.55) 55%, rgba(42,31,23,0.15) 100%)' }} />

        <div className="relative flex flex-col justify-end max-w-6xl mx-auto px-8 pb-20 md:pb-28" style={{ minHeight: '92vh' }}>
          <div className="max-w-lg">
            <p className="text-xs uppercase tracking-[0.35em] mb-6 font-medium" style={{ color: '#C9A435' }}>
              Spelling to Communicate
            </p>
            <h1 className="font-bold text-white mb-6"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: '1.12', letterSpacing: '-0.01em' }}>
              Every student has something to say.
            </h1>
            <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.72)', maxWidth: '38ch' }}>
              We hold space for that truth — one letterboard, one session, one student at a time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/practitioner-services"
                className="font-semibold px-7 py-3.5 rounded-full transition-all hover:opacity-90"
                style={{ background: '#C9A435', color: '#2a1f17' }}>
                Learn About Sessions
              </Link>
              <Link href="/about"
                className="font-medium px-7 py-3.5 rounded-full border transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)' }}>
                Our Philosophy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breath — opening quote */}
      <section style={{ background: '#fdf9f4' }}>
        <div className="max-w-3xl mx-auto px-8 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em] mb-8 font-medium" style={{ color: '#a08060' }}>
            Our Belief
          </p>
          <blockquote
            className="font-semibold leading-relaxed mb-8"
            style={{ color: '#2a1f17', fontSize: 'clamp(1.4rem, 3vw, 2rem)', lineHeight: '1.55' }}>
            &ldquo;Motor differences are not intellectual differences. Every person is presumed competent — not eventually, not potentially, but right now, exactly as they are.&rdquo;
          </blockquote>
          <p className="text-sm font-medium" style={{ color: '#a08060' }}>— Melody, Certified S2C Practitioner</p>
        </div>
      </section>

      {/* The Practice — organic, asymmetric */}
      <section className="py-24" style={{ background: '#f0ede8' }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* The real letterboard */}
            <div className="flex flex-col items-center md:items-start">
              <img
                src="/letterboard-az.jpg"
                alt="The black A-Z letterboard used in Spelling to Communicate sessions"
                className="w-full max-w-sm rounded-3xl shadow-2xl"
              />
              <p className="text-center mt-5 text-xs tracking-widest uppercase font-medium w-full max-w-sm" style={{ color: '#8a7060' }}>
                Every poke is an intention.
              </p>
            </div>

            <div className="space-y-6" style={{ color: '#5a4a3a', fontSize: '1.08rem', lineHeight: '1.8' }}>
              <p>
                The letterboard holds no agenda. It does not rush. It does not assume. It simply waits — for the student&apos;s hand, their intention, their thought made visible for the very first time.
              </p>
              <p>
                We begin with presence. With regulation. With the understanding that a nervous system needs to feel safe before it can express itself fully.
              </p>
              <p style={{ color: '#2a1f17', fontWeight: '600' }}>
                And when the conditions are right — when the room is calm and the practitioner is patient — students show us exactly who they are and what they know.
              </p>
              <div className="pt-2">
                <Link href="/our-practice"
                  className="font-medium text-sm inline-flex items-center gap-2 transition-all hover:gap-3"
                  style={{ color: '#C9A435' }}>
                  Inside a session →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The journey — fullwidth warmth */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] mb-5 font-medium" style={{ color: '#a08060' }}>The Story</p>
              <h2 className="font-bold mb-8" style={{ color: '#2a1f17', fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', lineHeight: '1.3' }}>
                It started with a very heavy bag.
              </h2>
              <div className="space-y-5 leading-relaxed" style={{ color: '#5a4a3a', fontSize: '1.05rem' }}>
                <p>
                  For years, I arrived at every session carrying a bag so heavy it had become part of my identity. Lesson plans. Student binders. Clipboards. Transcripts. Cameras. Always more paperwork.
                </p>
                <p>
                  I wasn&apos;t looking for software. I was looking for a better way to be present with my students.
                </p>
                <p>
                  So I started building tools — not to start a company, but because every minute spent managing paperwork was one less minute holding space for the person sitting across from me.
                </p>
                <p style={{ color: '#2a1f17', fontWeight: '600' }}>
                  Today I walk into sessions carrying little more than a tablet, my camera, and a tripod. Not because technology replaced my practice. Because it got out of the way of it.
                </p>
              </div>
              <div className="mt-10 pt-8 border-t" style={{ borderColor: '#e8ddd0' }}>
                <div className="flex items-center gap-4">
                  <img
                    src="/481072609_122154518738367665_7170235168370591795_n.jpg"
                    alt="Melody"
                    className="w-14 h-14 rounded-full object-cover object-top shadow"
                  />
                  <div>
                    <p className="font-semibold" style={{ color: '#2a1f17' }}>Melody</p>
                    <p className="text-sm" style={{ color: '#a08060' }}>Certified S2C Practitioner · Founder</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual aside — beliefs as organic list, not cards */}
            <div className="md:pt-16">
              <div className="rounded-3xl p-10" style={{ background: '#fdf9f4' }}>
                <p className="text-xs uppercase tracking-[0.3em] mb-8 font-medium" style={{ color: '#a08060' }}>What We Hold Sacred</p>
                <div className="space-y-6">
                  {[
                    'Every person is presumed competent.',
                    'Presence before performance.',
                    'The body carries wisdom the voice cannot always access.',
                    'Data tells a story — it never tells the whole story.',
                    'Families are partners, not passengers.',
                    'Progress is measured. But a student is never reduced to a number.',
                  ].map(belief => (
                    <div key={belief} className="flex items-start gap-4">
                      <span className="shrink-0 mt-1 text-xs" style={{ color: '#C9A435' }}>✦</span>
                      <p className="leading-relaxed" style={{ color: '#5a4a3a', fontSize: '0.97rem' }}>{belief}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The tracking — warm, not clinical */}
      <section className="relative overflow-hidden py-24 text-white" style={{ background: '#2a1f17' }}>
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] mb-5 font-medium" style={{ color: '#C9A435' }}>The Accuracy Chart</p>
              <h2 className="font-bold mb-6" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', lineHeight: '1.3' }}>
                Not a report card.<br />A map of a journey.
              </h2>
              <div className="space-y-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <p>
                  When you look at a student&apos;s accuracy chart over time, you are not looking at grades. You are looking at a nervous system learning to trust itself.
                </p>
                <p>
                  A dip in accuracy is not failure. It is often a dysregulation event — a hard day, a change in routine, something sensory. And the climb back up tells you something beautiful: the student did not give up.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                  We share this with every family. We explain what it means together. We celebrate the climb, not just the peak.
                </p>
              </div>
              <div className="mt-8">
                <Link href="/practice-tools"
                  className="font-medium text-sm inline-flex items-center gap-2 transition-all hover:gap-3"
                  style={{ color: '#C9A435' }}>
                  The tools we use →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/751113119_122228981102367665_2704634927348127284_n.jpg"
                alt="A student's accuracy chart showing progress over time"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Closing — invitation, not CTA */}
      <section className="py-28" style={{ background: '#fdf9f4' }}>
        <div className="max-w-2xl mx-auto px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] mb-8 font-medium" style={{ color: '#a08060' }}>An Invitation</p>
          <h2 className="font-bold mb-7"
            style={{ color: '#2a1f17', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: '1.3' }}>
            If this resonates with you —<br />we&apos;d love to connect.
          </h2>
          <p className="leading-relaxed mb-12" style={{ color: '#7a6a5a', fontSize: '1.05rem' }}>
            Whether you&apos;re a family just beginning to explore Spelling to Communicate, or someone who has been searching for a practitioner who sees your child the way you do — this work is for you.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="mailto:wordups2c@gmail.com"
              className="font-semibold px-8 py-4 rounded-full transition-all hover:opacity-90 shadow-lg"
              style={{ background: '#C9A435', color: '#2a1f17' }}>
              Reach Out
            </a>
            <Link href="/parent-resources"
              className="font-medium px-8 py-4 rounded-full border-2 transition-all hover:bg-white"
              style={{ borderColor: '#d4c0a8', color: '#7a6a5a' }}>
              Resources for Families
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
