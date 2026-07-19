import PublicNav from '../components/PublicNav'

export const metadata = {
  title: 'Contact — Word Up',
  description: 'Get in touch with Word Up. We\'d love to hear from you.',
}

export default function ContactPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(135deg, #1a0540 0%, #3b0f82 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-purple-200 text-lg max-w-xl mx-auto">
            Questions about services, tools, or the S2C journey? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact options */}
      <section className="py-20" style={{ background: '#fffbf0' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <a href="mailto:wordups2c@gmail.com"
              className="bg-white rounded-2xl p-8 border border-purple-100 shadow-sm hover:shadow-md transition-all group text-center">
              <div className="text-5xl mb-5">📧</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-purple-900 transition-colors" style={{ color: '#1a0540' }}>Email</h3>
              <p className="text-gray-500 text-sm mb-3">The best way to reach us for any question, big or small.</p>
              <p className="font-semibold text-sm" style={{ color: '#3b0f82' }}>wordups2c@gmail.com</p>
            </a>
            <div className="bg-white rounded-2xl p-8 border border-purple-100 shadow-sm text-center">
              <div className="text-5xl mb-5">⏱️</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a0540' }}>Response Time</h3>
              <p className="text-gray-500 text-sm mb-3">We typically respond within 1–2 business days.</p>
              <p className="font-semibold text-sm text-gray-400">Monday – Friday</p>
            </div>
          </div>

          {/* What to reach out about */}
          <div className="bg-white rounded-2xl p-8 border border-purple-100">
            <h3 className="text-lg font-bold mb-6" style={{ color: '#1a0540' }}>What can we help with?</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Questions about S2C sessions',
                'Information about the Practitioner Dashboard',
                'The Word Up Lesson Generator',
                'Family and parent support',
                'Practitioner consultation',
                'Practitioner Minute topic suggestions',
                'Technical support',
                'General questions',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-gray-600">
                  <span style={{ color: '#D4AF37' }}>✦</span>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <a href="mailto:wordups2c@gmail.com"
                className="inline-block font-bold px-10 py-4 rounded-xl text-base transition-all hover:scale-105"
                style={{ background: '#1a0540', color: 'white' }}>
                Send an Email →
              </a>
            </div>
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
