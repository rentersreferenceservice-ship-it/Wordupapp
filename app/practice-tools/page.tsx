import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Practice Tools — Word Up',
  description: 'Word Up practice tools: the Lesson Generator and the Practitioner Dashboard — one integrated workflow for S2C practitioners.',
}

export default function PracticeToolsPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Practice Tools</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">One System. All Your Practice.</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">More time for your students.</p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16" style={{ background: '#faf8f3' }}>
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            As my practice grew, I found myself creating tools to solve real challenges I encountered while supporting students and families.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            What started as simple resources gradually became an integrated system that helps me document progress objectively, organize lessons efficiently, communicate more clearly with families, and spend more time focused on my students and the communication journey we share.
          </p>
          <p className="text-lg leading-relaxed font-semibold" style={{ color: '#1d1d1d' }}>
            Today I&apos;m excited to share these tools with other practitioners.
          </p>
        </div>
      </section>

      {/* The flyer / social proof image */}
      <section className="bg-white py-4">
        <div className="max-w-3xl mx-auto px-6">
          <img
            src="/751113119_122228981102367665_2704634927348127284_n.jpg"
            alt="Word Up practice tools overview — Spend Less Time Managing Your Practice"
            className="w-full rounded-2xl shadow-md"
          />
        </div>
      </section>

      {/* Product 1: Lesson Generator */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="text-5xl shrink-0">📚</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A435' }}>Product One</p>
              <h2 className="text-3xl font-bold mb-1" style={{ color: '#1d1d1d' }}>Word Up Lesson Generator</h2>
              <p className="text-sm font-semibold text-gray-400">Subscription service · Sold separately</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-3xl">
            Generate professional, I-ASC Gold Standard Spelling to Communicate lessons in minutes. Each lesson is fully scaffolded, age-appropriate, and print-ready — aligned to the I-ASC Gold Standard.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '⚡', label: 'Lesson Generator' },
              { icon: '🗂️', label: 'Lesson Library' },
              { icon: '📖', label: '200+ Lessons' },
              { icon: '🖨️', label: 'Printable Lessons' },
            ].map(f => (
              <div key={f.label} className="rounded-xl p-4 text-center border border-gray-100" style={{ background: '#faf8f3' }}>
                <div className="text-3xl mb-2">{f.icon}</div>
                <p className="text-sm font-semibold" style={{ color: '#1d1d1d' }}>{f.label}</p>
              </div>
            ))}
          </div>
          <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
            className="inline-block font-bold px-8 py-3 rounded-xl text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: '#C9A435', color: '#1d1d1d' }}>
            Visit the Lesson Generator →
          </a>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Product 2: Practitioner Dashboard */}
      <section className="py-16" style={{ background: '#faf8f3' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="text-5xl shrink-0">🗂️</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A435' }}>Product Two</p>
              <h2 className="text-3xl font-bold mb-1" style={{ color: '#1d1d1d' }}>Practitioner Dashboard</h2>
              <p className="text-sm font-semibold text-gray-400">Complete practice management system</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed mb-12 max-w-3xl">
            This is not another lesson generator. The Practitioner Dashboard is a complete practice management system built specifically for Spelling to Communicate practitioners — covering every step of your workflow.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { phase: 'Prepare', icon: '📋', items: ['Choose or generate lessons', 'Build your session plan'] },
              { phase: 'Teach', icon: '🎯', items: ['Run session timer', 'Record missed pokes in real time'] },
              { phase: 'Measure', icon: '📈', items: ['Automatic accuracy calculations', 'Accuracy graphs', 'Objective progress tracking'] },
              { phase: 'Document', icon: '📁', items: ['Store transcripts', 'Store videos', 'Clinical notes', 'Invoices'] },
              { phase: 'Communicate', icon: '💬', items: ['Email families', 'Share documentation', 'Progress reports'] },
              { phase: 'Manage', icon: '⚙️', items: ['Calendar', 'Mileage', 'Income & Expenses', 'Resources'] },
            ].map(section => (
              <div key={section.phase} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="text-base font-bold" style={{ color: '#1d1d1d' }}>{section.phase}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-xs" style={{ color: '#C9A435' }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href="/practitioner/get-started"
              className="inline-block font-bold px-10 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-lg"
              style={{ background: '#1d1d1d', color: 'white' }}>
              Start Your Free Trial →
            </a>
            <p className="text-xs text-gray-400 mt-3">30-day free trial · No charge until your trial ends</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
