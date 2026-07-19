import PublicNav from '../components/PublicNav'
import Link from 'next/link'

export const metadata = {
  title: 'Parent Resources — Word Up',
  description: 'Resources and support for families of students using Spelling to Communicate.',
}

export default function ParentResourcesPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>Parent Resources</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Supporting Families on the S2C Journey</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Families are essential partners in the Spelling to Communicate journey. These resources are here to support you every step of the way.
          </p>
        </div>
      </section>

      {/* What is S2C */}
      <section className="py-20" style={{ background: '#fffbf0' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center" style={{ color: '#1a0540' }}>Understanding Spelling to Communicate</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '✋',
                title: 'What is S2C?',
                body: 'Spelling to Communicate (S2C) is a method that teaches individuals with motor and communication differences to point to letters on a letterboard to communicate. It is grounded in the belief that all individuals have the capacity for communication and learning.',
              },
              {
                icon: '🧠',
                title: 'The Motor Connection',
                body: 'Many individuals with autism and other conditions experience motor planning challenges that affect their ability to speak. S2C addresses this by teaching intentional motor movements — starting with gross motor and progressing toward pointing to individual letters.',
              },
              {
                icon: '📋',
                title: 'What Does a Session Look Like?',
                body: 'A session begins with regulation and motor warm-ups, followed by a structured lesson with scaffolded questions. Practitioners use a letterboard and guide the student through increasingly independent pointing to build communication skills.',
              },
              {
                icon: '🏠',
                title: 'Your Role at Home',
                body: 'Families are communication partners. Practicing calm, supportive interaction at home — presuming competence, using the letterboard regularly, and staying consistent — makes a significant difference in your student\'s progress.',
              },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-8 border border-purple-100 shadow-sm">
                <div className="text-4xl mb-5">{s.icon}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1a0540' }}>{s.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Core Beliefs</h2>
          <div className="space-y-4 text-left">
            {[
              'Every individual is presumed competent and capable of communication.',
              'Motor differences are not intellectual differences.',
              'Consistent, structured practice leads to real, measurable progress.',
              'Families and practitioners are partners — not separate from each other.',
              'Progress is documented objectively and shared transparently.',
            ].map(belief => (
              <div key={belief} className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4">
                <span className="text-lg shrink-0 mt-0.5" style={{ color: '#D4AF37' }}>✦</span>
                <p className="text-sm text-white leading-relaxed">{belief}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a0540' }}>Ready to Learn More?</h2>
          <p className="text-gray-600 mb-8">
            Reach out with questions, or learn more about practitioner services available for your family.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact"
              className="font-bold px-8 py-3 rounded-xl text-sm transition-all hover:scale-105"
              style={{ background: '#1a0540', color: 'white' }}>
              Contact Us →
            </Link>
            <Link href="/practitioner-services"
              className="border-2 font-bold px-8 py-3 rounded-xl text-sm transition-all hover:bg-purple-50"
              style={{ borderColor: '#1a0540', color: '#1a0540' }}>
              Practitioner Services
            </Link>
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
