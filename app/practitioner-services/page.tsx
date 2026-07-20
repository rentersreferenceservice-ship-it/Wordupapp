import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Practitioner Services — Word Up',
  description: 'One-on-one Spelling to Communicate sessions and family support from an experienced Certified S2C Practitioner.',
}

export default function PractitionerServicesPage() {
  return (
    <>
      <PublicNav />

      {/* Hero — full bleed, adult session */}
      <section className="relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <img
          src="/s2c-adult-session.png"
          alt="A Spelling to Communicate session in a warm, intentional space"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(42,31,23,0.88) 0%, rgba(42,31,23,0.6) 55%, rgba(42,31,23,0.15) 100%)' }} />
        <div className="relative max-w-5xl mx-auto px-8 flex items-end" style={{ minHeight: '60vh' }}>
          <div className="max-w-lg pb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>Practitioner Services</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Supporting students &amp; families.
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Evidence-based Spelling to Communicate services delivered with warmth, structure, and genuine care for every student.
            </p>
          </div>
        </div>
      </section>

      {/* Service 1 — One-on-One Sessions */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>One-on-One Sessions</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#2a1f17', lineHeight: '1.25' }}>
                Every session is built for one student.
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#5a4a3a' }}>
                <p>
                  Individualized Spelling to Communicate sessions tailored to each student&apos;s unique needs, pace, and communication goals. Every session is structured, purposeful, and student-centered.
                </p>
                <p>
                  We begin with regulation. We move through a carefully scaffolded lesson. We close with reflection. And we track every response — objectively, honestly, and without judgment.
                </p>
              </div>
            </div>
            <div>
              <img
                src="/s2c-session-hero.png"
                alt="A student pointing to the letterboard during a one-on-one S2C session"
                className="w-full rounded-3xl shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Service 2 — Progress Tracking */}
      <section className="py-20" style={{ background: '#fdf9f4' }}>
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="md:order-2">
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>Progress Tracking</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#2a1f17', lineHeight: '1.25' }}>
                Objective data. Honest documentation.
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#5a4a3a' }}>
                <p>
                  Accuracy data is collected every session and shared transparently with families. Not as a report card — as a map. A map of regulation, of motor development, of a nervous system learning to trust itself.
                </p>
                <p>
                  Dips tell one part of the story. The climb back up tells another. We read both together, with families, and we never reduce a student to a number.
                </p>
              </div>
            </div>
            <div className="md:order-1 space-y-4">
              {[
                {
                  label: 'Speller A',
                  points: [62, 55, 70, 68, 80, 77, 85, 91],
                },
                {
                  label: 'Speller B',
                  points: [48, 60, 72, 65, 78, 83, 89, 95],
                },
                {
                  label: 'Speller C',
                  points: [71, 74, 68, 80, 82, 88, 92, 97],
                },
              ].map(({ label, points }) => {
                const w = 260, h = 64, pad = 8
                const minV = 40, maxV = 100
                const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2))
                const ys = points.map(v => h - pad - ((v - minV) / (maxV - minV)) * (h - pad * 2))
                const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
                const last = points[points.length - 1]
                return (
                  <div key={label} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold" style={{ color: '#2a1f17' }}>{label}</p>
                      <p className="text-xs font-bold" style={{ color: '#C9A435' }}>{last}%</p>
                    </div>
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 56 }}>
                      <defs>
                        <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C9A435" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#C9A435" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${d} L${xs[xs.length - 1].toFixed(1)},${h} L${xs[0].toFixed(1)},${h} Z`}
                        fill={`url(#g-${label})`}
                      />
                      <path d={d} fill="none" stroke="#C9A435" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill="#C9A435" />
                    </svg>
                  </div>
                )
              })}
              <p className="text-xs text-center" style={{ color: '#a08060' }}>
                Anonymized · Real student data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service 3 — Family Support */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>Family Support &amp; Guidance</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#2a1f17', lineHeight: '1.25' }}>
                Families are partners — not passengers.
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#5a4a3a' }}>
                <p>
                  Parents and communication partners receive training, resources, and ongoing support to reinforce skills between sessions and strengthen the student&apos;s communication journey at home.
                </p>
                <p>
                  We share session transcripts, explain what the data means, and make sure every family feels informed, included, and confident in the work we&apos;re doing together.
                </p>
              </div>
            </div>
            <div>
              <img
                src="/481072609_122154518738367665_7170235168370591795_n.jpg"
                alt="Melody — Certified S2C Practitioner"
                className="w-full rounded-3xl shadow-xl object-cover object-top"
                style={{ maxHeight: '420px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Service 4 — Practitioner Consultation */}
      <section className="py-20" style={{ background: '#f0ede8' }}>
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="md:order-2">
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>Practitioner Consultation</p>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#2a1f17', lineHeight: '1.25' }}>
                Collaborative, grounded, respectful.
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#5a4a3a' }}>
                <p>
                  Consultations available for practitioners, educators, and support teams working alongside S2C spellers. The tone is always collegial. The foundation is always evidence.
                </p>
                <p>
                  Whether you are new to Spelling to Communicate or experienced and looking for a thought partner — we welcome the conversation.
                </p>
              </div>
            </div>
            <div className="md:order-1">
              <img
                src="/letterboard-az.jpg"
                alt="The A-Z letterboard — the tool at the center of every S2C session"
                className="w-full rounded-3xl shadow-xl"
                style={{ maxHeight: '380px', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Approach — text only, no icons */}
      <section className="py-20 text-white" style={{ background: '#2a1f17' }}>
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-medium mb-8" style={{ color: '#C9A435' }}>Our Approach</p>
          <div className="space-y-5 leading-relaxed mb-12" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem' }}>
            <p>Every session is grounded in the principles of Spelling to Communicate — structured, evidence-based, respectful, and hopeful.</p>
            <p>Students are presumed competent. Families are treated as partners. Progress is documented and shared with transparency.</p>
            <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Evidence over assumption. Always.</p>
          </div>
          <Link href="/contact"
            className="inline-block font-semibold px-8 py-4 rounded-full transition-all hover:opacity-90"
            style={{ background: '#C9A435', color: '#2a1f17' }}>
            Get in Touch
          </Link>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
