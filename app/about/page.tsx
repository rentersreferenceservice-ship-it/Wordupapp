import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Our Philosophy — Word Up',
  description: 'Presuming competence. Believing in every student. How and why Melody practices Spelling to Communicate.',
}

export default function PhilosophyPage() {
  return (
    <>
      <PublicNav />

      {/* Hero — Melody's photo full bleed */}
      <section className="relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <img
          src="/nature-family-mountains.jpg"
          alt="Two people hiking toward mountain peaks — the journey forward"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(29,29,29,0.85) 0%, rgba(29,29,29,0.6) 50%, rgba(29,29,29,0.2) 100%)' }} />
        <div className="relative max-w-5xl mx-auto px-6 py-20 flex items-end" style={{ minHeight: '60vh' }}>
          <div className="max-w-lg pb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Our Philosophy</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Every person is presumed competent.
            </h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.75)' }}>
              That is not a slogan. It is the foundation of everything we do.
            </p>
          </div>
        </div>
      </section>

      {/* Melody's words */}
      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: '#C9A435' }}>From Melody</p>

          <div className="space-y-7 text-gray-700 leading-relaxed text-lg">
            <p>
              I became a Spelling to Communicate practitioner because I believe — without reservation — that every person has the capacity to think, to learn, and to communicate.
            </p>
            <p>
              What gets in the way is not intelligence. What gets in the way is motor. Many of the students I work with have spent years being misunderstood — not because they didn&apos;t understand the world around them, but because their bodies couldn&apos;t yet show it.
            </p>
            <p>
              Spelling to Communicate changes that. When we put a letterboard in front of a student and presume they are capable of pointing to the right letter — and then wait, and believe, and don&apos;t give up — something extraordinary happens.
            </p>
            <blockquote className="border-l-4 pl-6 py-2 my-8 italic font-medium text-xl" style={{ borderColor: '#C9A435', color: '#333' }}>
              &ldquo;They show you who they are.&rdquo;
            </blockquote>
            <p>
              That is why I practice the way I do. Every session is structured and evidence-based. Every lesson is built on real knowledge and real curiosity. Every poke is tracked so that we can see, clearly and honestly, how a student is progressing.
            </p>
            <p>
              I share that data transparently with families — not to alarm, not to celebrate prematurely, but because families deserve to see the truth of their student&apos;s journey. The accuracy chart does not tell us how smart a student is. It tells us how regulated they were, how the motor connection is strengthening, and where we go next together.
            </p>
            <p>
              The tools I built — the lesson generator, the dashboard, the session tracker — exist entirely in service of this. Less time managing paperwork means more time being fully present with the student sitting in front of me.
            </p>
            <p className="font-semibold text-lg" style={{ color: '#1d1d1d' }}>
              That is the philosophy. That is the practice. That is Word Up.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex items-center gap-5">
            <img
              src="/481072609_122154518738367665_7170235168370591795_n.jpg"
              alt="Melody"
              className="w-16 h-16 rounded-full object-cover object-top shadow"
            />
            <div>
              <p className="font-bold" style={{ color: '#1d1d1d' }}>Melody</p>
              <p className="text-sm text-gray-500">Certified S2C Practitioner · Founder, Word Up LLC</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core beliefs */}
      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-8 text-center" style={{ color: '#C9A435' }}>What We Believe</p>
          <div className="space-y-3">
            {[
              'Every individual is presumed competent and capable of communication.',
              'Motor differences are not intellectual differences.',
              'Structured, consistent practice leads to real, measurable progress.',
              'Families are essential partners — not bystanders.',
              'Progress belongs to the student. We document it honestly and share it openly.',
              'The goal is not a perfect session. The goal is a student who feels seen.',
            ].map(belief => (
              <div key={belief} className="flex items-start gap-4 rounded-xl px-6 py-4" style={{ background: '#2d2d2d' }}>
                <span className="shrink-0 mt-0.5 text-lg" style={{ color: '#C9A435' }}>✦</span>
                <p className="text-gray-300 leading-relaxed">{belief}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bridge */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1d1d1d' }}>Want to see it in practice?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Take a look at what a session actually looks like — the letterboard, the structure, the data, and what it all means for a student&apos;s communication journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/our-practice"
              className="font-bold px-8 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
              style={{ background: '#1d1d1d', color: 'white' }}>
              Inside a Session →
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
