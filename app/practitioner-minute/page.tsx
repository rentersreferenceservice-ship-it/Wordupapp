import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'

export const metadata = {
  title: 'Practitioner Minute — Word Up',
  description: 'Evidence-based articles and insights for Spelling to Communicate practitioners. Evidence Over Assumption.',
}

export default function PractitionerMinutePage() {
  return (
    <>
      <PublicNav />

      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Practitioner Minute</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Evidence Over Assumption.</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Short, evidence-based articles and insights for Spelling to Communicate practitioners — supportive, grounded, and never confrontational.
          </p>
        </div>
      </section>

      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1d1d1d' }}>What is the Practitioner Minute?</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            The Practitioner Minute is a collection of short, readable articles and videos designed for busy S2C practitioners. Each piece focuses on one clear, evidence-based idea — something you can read in a minute and apply the same day.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            The tone is always supportive. The content is always grounded in evidence. And the goal is always the same: to help you show up more confidently for your students.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1d1d1d' }}>What We Cover</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Objective Data', body: 'How to use accuracy data to tell a clear, honest story of student progress.' },
              { title: 'Session Strategy', body: 'Practical techniques for regulation, motor warm-up, and scaffolding spelling success.' },
              { title: 'Family Communication', body: 'How to communicate progress, set expectations, and partner with families effectively.' },
              { title: 'Documentation', body: 'Clinical documentation that is clear, accurate, and useful — not just paperwork.' },
              { title: 'Evidence & Research', body: 'Staying current with the research that supports S2C and presumed competence.' },
              { title: 'Practitioner Wellbeing', body: 'How to sustain a meaningful, organized practice without burning out.' },
            ].map(p => (
              <div key={p.title} className="rounded-2xl p-6 border border-gray-100" style={{ background: '#fdf9f4' }}>
                <p className="text-lg mb-3 font-bold" style={{ color: '#C9A435' }}>✦</p>
                <h3 className="font-bold mb-2 text-sm" style={{ color: '#2a1f17' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5a4a3a' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-3xl mb-6 font-bold" style={{ color: '#C9A435' }}>✦</p>
          <h2 className="text-2xl font-bold mb-4">Articles Coming Soon</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            The Practitioner Minute is actively being built. Check back soon — or get in touch to suggest a topic you&apos;d love to see covered.
          </p>
          <a href="/contact"
            className="inline-block font-bold px-8 py-3 rounded-xl text-sm transition-all hover:opacity-90"
            style={{ background: '#C9A435', color: '#1d1d1d' }}>
            Suggest a Topic →
          </a>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
