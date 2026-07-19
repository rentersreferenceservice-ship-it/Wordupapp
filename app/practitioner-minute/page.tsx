import PublicNav from '../components/PublicNav'

export const metadata = {
  title: 'Practitioner Minute — Word Up',
  description: 'Evidence-based articles and insights for Spelling to Communicate practitioners. Evidence Over Assumption.',
}

export default function PractitionerMinutePage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>Practitioner Minute</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Evidence Over Assumption.</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Short, evidence-based articles and insights for Spelling to Communicate practitioners — supportive, grounded, and never confrontational.
          </p>
        </div>
      </section>

      {/* What is Practitioner Minute */}
      <section className="py-20" style={{ background: '#fffbf0' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a0540' }}>What is the Practitioner Minute?</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            The Practitioner Minute is a collection of short, readable articles and videos designed for busy S2C practitioners. Each piece focuses on one clear, evidence-based idea — something you can read in a minute and apply the same day.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            The tone is always supportive. The content is always grounded in evidence. And the goal is always the same: to help you show up more confidently for your students.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1a0540' }}>What We Cover</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📊',
                title: 'Objective Data',
                body: 'How to use accuracy data to tell a clear, honest story of student progress.',
              },
              {
                icon: '🎯',
                title: 'Session Strategy',
                body: 'Practical techniques for regulation, motor warm-up, and scaffolding spelling success.',
              },
              {
                icon: '💬',
                title: 'Family Communication',
                body: 'How to communicate progress, set expectations, and partner with families effectively.',
              },
              {
                icon: '📋',
                title: 'Documentation',
                body: 'Clinical documentation that is clear, accurate, and useful — not just paperwork.',
              },
              {
                icon: '🧠',
                title: 'Evidence & Research',
                body: 'Staying current with the research that supports S2C and presumed competence.',
              },
              {
                icon: '💛',
                title: 'Practitioner Wellbeing',
                body: 'How to sustain a meaningful, organized practice without burning out.',
              },
            ].map(p => (
              <div key={p.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold mb-2 text-sm" style={{ color: '#1a0540' }}>{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">📬</div>
          <h2 className="text-2xl font-bold mb-4">Articles Coming Soon</h2>
          <p className="text-purple-200 mb-8 leading-relaxed">
            The Practitioner Minute is actively being built. Check back soon for the first articles, or get in touch to suggest a topic you&apos;d love to see covered.
          </p>
          <a href="/contact"
            className="inline-block font-bold px-8 py-3 rounded-xl text-sm transition-all hover:scale-105"
            style={{ background: '#D4AF37', color: '#1a0540' }}>
            Suggest a Topic →
          </a>
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
