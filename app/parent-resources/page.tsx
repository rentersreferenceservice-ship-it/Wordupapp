import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Parent Resources — Word Up',
  description: 'Resources and support for families of students using Spelling to Communicate.',
}

export default function ParentResourcesPage() {
  return (
    <>
      <PublicNav />

      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Parent Resources</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Supporting Families on the S2C Journey</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Families are essential partners in the Spelling to Communicate journey. These resources are here to support you every step of the way.
          </p>
        </div>
      </section>

      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center" style={{ color: '#1d1d1d' }}>Understanding Spelling to Communicate</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '✋', title: 'What is S2C?', body: 'Spelling to Communicate (S2C) is a method that teaches individuals with motor and communication differences to point to letters on a letterboard to communicate. It is grounded in the belief that all individuals have the capacity for communication and learning.' },
              { icon: '🧠', title: 'The Motor Connection', body: 'Many individuals with autism and other conditions experience motor planning challenges that affect their ability to speak. S2C addresses this by teaching intentional motor movements — starting with gross motor and progressing toward pointing to individual letters.' },
              { icon: '📋', title: 'What Does a Session Look Like?', body: 'A session begins with regulation and motor warm-ups, followed by a structured lesson with scaffolded questions. Practitioners use a letterboard and guide the student through increasingly independent pointing to build communication skills.' },
              { icon: '🏠', title: 'Your Role at Home', body: 'Families are communication partners. Practicing calm, supportive interaction at home — presuming competence, using the letterboard regularly, and staying consistent — makes a significant difference in your student\'s progress.' },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="text-4xl mb-5">{s.icon}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1d1d1d' }}>{s.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Core Beliefs</h2>
          <div className="space-y-3 text-left mb-10">
            {[
              'Every individual is presumed competent and capable of communication.',
              'Motor differences are not intellectual differences.',
              'Consistent, structured practice leads to real, measurable progress.',
              'Families and practitioners are partners — not separate from each other.',
              'Progress is documented objectively and shared transparently.',
            ].map(belief => (
              <div key={belief} className="flex items-start gap-3 rounded-xl px-5 py-4" style={{ background: '#2d2d2d' }}>
                <span className="shrink-0 mt-0.5" style={{ color: '#C9A435' }}>✦</span>
                <p className="text-sm text-gray-300 leading-relaxed">{belief}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact"
              className="font-bold px-8 py-3 rounded-xl text-sm transition-all hover:opacity-90"
              style={{ background: '#C9A435', color: '#1d1d1d' }}>
              Contact Us →
            </Link>
            <Link href="/practitioner-services"
              className="border border-gray-600 font-bold px-8 py-3 rounded-xl text-sm transition-all hover:border-gray-400 text-white">
              Practitioner Services
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
