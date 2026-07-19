import PublicNav from '../components/PublicNav'

export const metadata = {
  title: 'Practitioner Services — Word Up',
  description: 'One-on-one Spelling to Communicate sessions and family support from an experienced Certified S2C Practitioner.',
}

export default function PractitionerServicesPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>Practitioner Services</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Supporting Students &amp; Families</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Experienced, evidence-based Spelling to Communicate services — delivered with warmth, structure, and genuine care for every student.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-20" style={{ background: '#fffbf0' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '🎯',
                title: 'One-on-One S2C Sessions',
                body: 'Individualized Spelling to Communicate sessions tailored to each student\'s unique needs, pace, and communication goals. Every session is structured, purposeful, and student-centered.',
              },
              {
                icon: '📈',
                title: 'Progress Tracking',
                body: 'Objective accuracy data collected every session. Families receive clear, evidence-based documentation of their student\'s growth over time.',
              },
              {
                icon: '👨‍👩‍👧',
                title: 'Family Support & Guidance',
                body: 'Parents and communication partners receive training, resources, and ongoing support to reinforce skills between sessions and strengthen the student\'s communication journey at home.',
              },
              {
                icon: '🤝',
                title: 'Practitioner Consultation',
                body: 'Consultations available for practitioners, educators, and teams working alongside S2C spellers. Collaborative, respectful, and grounded in best practice.',
              },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-8 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-5">{s.icon}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1a0540' }}>{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Approach</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: '📊', label: 'Objective Data' },
              { icon: '🧡', label: 'Real Progress' },
              { icon: '✅', label: 'Evidence Over Assumption' },
            ].map(p => (
              <div key={p.label} className="bg-white/10 border border-white/15 rounded-xl px-5 py-5">
                <div className="text-3xl mb-3">{p.icon}</div>
                <p className="text-sm font-semibold">{p.label}</p>
              </div>
            ))}
          </div>
          <p className="text-purple-200 leading-relaxed mb-8">
            Every session is grounded in the principles of Spelling to Communicate — structured, evidence-based, respectful, and hopeful. Students are presumed competent. Families are treated as partners. Progress is documented and shared with transparency.
          </p>
          <a href="/contact"
            className="inline-block font-bold px-10 py-4 rounded-xl text-base transition-all hover:scale-105"
            style={{ background: '#D4AF37', color: '#1a0540' }}>
            Get in Touch →
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
