import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'

export const metadata = {
  title: 'Contact — Word Up',
  description: 'Get in touch with Word Up. Questions about S2C services, tools, or the practitioner dashboard.',
}

export default function ContactPage() {
  return (
    <>
      <PublicNav />

      <section className="py-16 text-white" style={{ background: '#1d1d1d' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C9A435' }}>Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Questions about services, tools, or the S2C journey? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-20" style={{ background: '#faf8f3' }}>
        <div className="max-w-3xl mx-auto px-6">

          {/* Contact cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            <a href="tel:6033157140"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all text-center group">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="font-bold mb-1 group-hover:opacity-80 transition-colors" style={{ color: '#1d1d1d' }}>Phone</h3>
              <p className="text-sm font-semibold" style={{ color: '#C9A435' }}>603-315-7140</p>
            </a>

            <a href="mailto:wordups2c@gmail.com"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all text-center group">
              <div className="text-4xl mb-4">✉️</div>
              <h3 className="font-bold mb-1 group-hover:opacity-80 transition-colors" style={{ color: '#1d1d1d' }}>Email</h3>
              <p className="text-sm font-semibold" style={{ color: '#C9A435' }}>wordups2c@gmail.com</p>
            </a>

            <a href="https://www.facebook.com/WordUpS2C" target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all text-center group">
              <div className="text-4xl mb-4">📘</div>
              <h3 className="font-bold mb-1 group-hover:opacity-80 transition-colors" style={{ color: '#1d1d1d' }}>Facebook</h3>
              <p className="text-sm font-semibold" style={{ color: '#C9A435' }}>Word Up S2C</p>
            </a>
          </div>

          {/* What to reach out about */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6" style={{ color: '#1d1d1d' }}>What can we help with?</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
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
                  <span style={{ color: '#C9A435' }}>✦</span>
                  {item}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">We typically respond within 1–2 business days.</p>
              <a href="mailto:wordups2c@gmail.com"
                className="inline-block font-bold px-10 py-4 rounded-xl text-base transition-all hover:opacity-90 shadow-md"
                style={{ background: '#1d1d1d', color: 'white' }}>
                Send an Email →
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
