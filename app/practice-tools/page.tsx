import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import MockDashboardChart from './MockDashboardChart'

function PractitionerDashboardMockup() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: '#d1d5db' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-md px-4 py-1 text-xs font-medium flex items-center gap-2"
            style={{ color: '#6b7280', border: '1px solid #e5e7eb', minWidth: '260px', maxWidth: '380px' }}>
            <span style={{ color: '#9ca3af' }}>🔒</span>
            wordups2c.com/practitioner/students/…
          </div>
        </div>
      </div>

      {/* App shell */}
      <div style={{ background: '#f9fafb' }}>
        {/* App nav */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div className="flex items-center gap-2.5">
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-7 w-auto rounded-lg" />
            <div>
              <p className="text-[10px] font-black tracking-wider leading-none" style={{ color: '#111827' }}>WORD UP</p>
              <p className="text-[7px] font-semibold tracking-widest" style={{ color: '#C9A435' }}>PRACTITIONER DASHBOARD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] px-2.5 py-1 rounded-lg" style={{ background: '#f3f4f6', color: '#6b7280' }}>← Dashboard</div>
            <div className="text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white" style={{ background: '#2563eb' }}>Progress Report</div>
          </div>
        </div>

        {/* Student header */}
        <div className="px-4 py-3 bg-white" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <p className="text-base font-bold" style={{ color: '#111827' }}>Student Record</p>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Adult Speller · Active</p>
        </div>

        <div className="p-4 space-y-3">
          {/* Start session */}
          <div className="rounded-xl p-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: '#1e40af' }}>Start New Session</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg px-3 py-1.5 text-[10px]" style={{ background: 'white', border: '1px solid #dbeafe', color: '#9ca3af' }}>
                Choose a lesson from the library…
              </div>
              <div className="text-[10px] px-3 py-1.5 rounded-lg font-semibold text-white shrink-0" style={{ background: '#2563eb' }}>Start</div>
            </div>
          </div>

          {/* Accuracy — featured dark card (matches the real thing) */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#1a1410' }}>
            <div className="px-3 pt-3 pb-2">
              <p className="text-[8px] uppercase tracking-[0.25em] font-bold mb-1" style={{ color: '#C9A435' }}>Objective Data · Real Progress</p>
              <p className="text-xs font-bold text-white">Accuracy History</p>
              <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Spelling accuracy across completed sessions</p>
            </div>
            {/* Live accuracy chart — crisp SVG, no identifying info */}
            <div className="mx-3 rounded-lg bg-white px-3 pt-3 pb-1">
              <MockDashboardChart />
            </div>
            <div className="px-3 pb-3 pt-2">
              <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <span style={{ color: '#C9A435' }}>✦</span> Dips often reflect dysregulation events — not regression. The climb back is what we watch for.
              </p>
            </div>
          </div>

          {/* Session history */}
          <div className="rounded-xl bg-white p-3" style={{ border: '1px solid #f3f4f6' }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: '#111827' }}>Session History</p>
            {[
              { title: 'The Water Cycle', date: 'Jul 17', done: true },
              { title: 'The Human Brain', date: 'Jul 10', done: true },
              { title: 'Open Session', date: 'Jul 3', done: false },
            ].map(s => (
              <div key={s.title} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: '1px solid #f9fafb' }}>
                <div>
                  <p className="text-[11px] font-medium" style={{ color: '#374151' }}>{s.title}</p>
                  <p className="text-[9px]" style={{ color: '#9ca3af' }}>{s.date}</p>
                </div>
                <div className="text-[9px] font-semibold" style={{ color: s.done ? '#2563eb' : '#ea580c' }}>
                  {s.done ? 'Transcript →' : '▶ Resume'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Practice Tools — Word Up',
  description: 'Word Up practice tools: the Lesson Generator and the Practitioner Dashboard — one integrated workflow for S2C practitioners.',
}

function LessonGeneratorMockup() {
  const hunks = [
    {
      number: 1,
      topic: 'The James Webb Space Telescope',
      questions: [
        { type: 'KNOWN', color: '#15803d', bg: '#f0fdf4', label: 'K', q: 'What is the telescope that looks at space called?' },
        { type: 'KNOWN', color: '#15803d', bg: '#f0fdf4', label: 'K', q: 'When did the James Webb Telescope launch into space?' },
        { type: 'SEMI-OPEN', color: '#ea580c', bg: '#fff7ed', label: 'S', q: 'What does the MIRROR collect from far away stars and galaxies?' },
        { type: 'SEMI-OPEN', color: '#ea580c', bg: '#fff7ed', label: 'S', q: 'Name two things the text says the telescope can observe.' },
        { type: 'MATH', color: '#7e22ce', bg: '#faf5ff', label: 'M', q: 'How many miles from Earth is the Lagrange Point?' },
        { type: 'PRIOR KNOWLEDGE', color: '#2563eb', bg: '#eff6ff', label: 'P', q: 'What do you already know about space exploration?' },
        { type: 'OPEN', color: '#db2777', bg: '#fdf2f8', label: 'O', q: 'If you could explore any part of space, where would you go and why?' },
        { type: 'VAKT', color: '#dc2626', bg: '#fef2f2', label: 'V', q: 'Watch: James Webb Telescope — First Images Explained' },
      ],
    },
  ]

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: '#d1d5db', maxWidth: '100%' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-md px-4 py-1 text-xs font-medium flex items-center gap-2"
            style={{ color: '#6b7280', border: '1px solid #e5e7eb', minWidth: '260px', maxWidth: '380px' }}>
            <span style={{ color: '#9ca3af' }}>🔒</span>
            worduplessongenerator.com/lessons
          </div>
        </div>
      </div>

      {/* App content */}
      <div style={{ background: '#f9fafb' }}>
        {/* App nav */}
        <div className="flex items-center justify-between px-5 py-3 bg-white" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div className="flex items-center gap-3">
            <img src="/word_up_clean.jpeg" alt="Word Up" className="h-8 w-auto rounded-lg" />
            <div>
              <p className="text-xs font-black tracking-wider leading-none" style={{ color: '#111827' }}>WORD UP</p>
              <p className="text-[8px] font-semibold tracking-widest" style={{ color: '#C9A435' }}>LESSON GENERATOR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs px-3 py-1 rounded-lg font-medium" style={{ background: '#f3f4f6', color: '#6b7280' }}>All Lessons</div>
            <div className="text-xs px-3 py-1 rounded-lg font-medium text-white" style={{ background: '#2563eb' }}>Generate New</div>
          </div>
        </div>

        {/* Lesson header */}
        <div className="px-5 py-4 bg-white" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Science · Teens (15–17) · Verified ✓</p>
              <h3 className="text-base font-bold" style={{ color: '#111827' }}>The James Webb Space Telescope</h3>
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="text-xs px-2.5 py-1 rounded-lg border font-medium" style={{ color: '#374151', borderColor: '#e5e7eb' }}>🖨 Print</div>
            </div>
          </div>
        </div>

        {/* Hunk */}
        <div className="px-5 py-4">
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e5e7eb', background: 'white' }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: '#1e3a5f' }}>
              <p className="text-xs font-bold text-white tracking-wide">HUNK 1 of 3</p>
              <p className="text-[10px] font-semibold" style={{ color: '#93c5fd' }}>The James Webb Space Telescope</p>
            </div>

            {/* Passage text */}
            <div className="px-4 py-3" style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <p className="text-[11px] leading-relaxed" style={{ color: '#475569' }}>
                The James Webb Space Telescope (JWST) launched on December 25, 2021 and travels one million miles from Earth to its position at the Lagrange Point, where the gravity of Earth and the Sun keeps it perfectly steady. Its massive gold-and-beryllium mirror, made of 18 hexagonal pieces, captures light from stars and galaxies billions of years old...
              </p>
            </div>

            {/* Questions */}
            <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
              {hunks[0].questions.map((q, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[9px] font-black"
                    style={{ background: q.bg, color: q.color, border: `1px solid ${q.color}22` }}>
                    {q.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest mr-2" style={{ color: q.color }}>{q.type}</span>
                    <span className="text-[11px]" style={{ color: '#374151' }}>{q.q}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer blank */}
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <div className="flex-1 h-7 rounded-lg border-2 border-dashed" style={{ borderColor: '#d1d5db' }} />
              <div className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background: '#2563eb' }}>Next →</div>
            </div>
          </div>

          {/* Hunk nav pills */}
          <div className="flex gap-2 mt-3 justify-center">
            {[1,2,3].map(n => (
              <div key={n} className="w-8 h-1.5 rounded-full" style={{ background: n === 1 ? '#2563eb' : '#e5e7eb' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PracticeToolsPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="py-20 text-white" style={{ background: '#2a1f17' }}>
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-medium mb-5" style={{ color: '#C9A435' }}>Practice Tools</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5" style={{ lineHeight: '1.15' }}>Built for the session. Not the paperwork.</h1>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Built one at a time, to solve real problems in real sessions — so practitioners can spend more time with the student in front of them.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16" style={{ background: '#fdf9f4' }}>
        <div className="max-w-3xl mx-auto px-8">
          <div className="space-y-5 leading-relaxed" style={{ color: '#5a4a3a', fontSize: '1.05rem' }}>
            <p>
              As my practice grew, I found myself creating tools to solve real challenges I encountered while supporting students and families.
            </p>
            <p>
              What started as simple resources gradually became an integrated system — one that helps me document progress objectively, organize lessons efficiently, communicate more clearly with families, and spend more time fully present in my sessions.
            </p>
            <p className="font-semibold" style={{ color: '#2a1f17' }}>
              Today I&apos;m honored to share these tools with other practitioners.
            </p>
          </div>
        </div>
      </section>

      {/* Product 1: Lesson Generator — with mockup screenshot */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-14 items-start">

            {/* Left: description */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>Product One</p>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#2a1f17' }}>Word Up Lesson Generator</h2>
              <p className="text-sm font-medium mb-6" style={{ color: '#a08060' }}>Subscription service · Sold separately</p>
              <div className="space-y-4 leading-relaxed mb-8" style={{ color: '#5a4a3a' }}>
                <p>
                  Generate professional, I-ASC Gold Standard Spelling to Communicate lessons in minutes. Each lesson is fully scaffolded, age-appropriate, and print-ready.
                </p>
                <p>
                  Every lesson follows the S2C structure: KNOWN, SEMI-OPEN, MATH, PRIOR KNOWLEDGE, OPEN, and VAKT questions — color-coded and sequenced correctly every time.
                </p>
                <p className="text-sm rounded-xl px-5 py-4" style={{ background: '#faf5eb', borderLeft: '3px solid #C9A435', color: '#4a3a2a' }}>
                  <span className="font-semibold">Practitioner subscribers</span> also get access to a private lesson library — a growing curated collection of pre-built S2C lessons available directly inside the Practitioner Dashboard.
                </p>
              </div>
              <div className="space-y-2 mb-8">
                {[
                  { color: '#15803d', label: 'KNOWN', desc: 'Factual recall — directly from the text' },
                  { color: '#ea580c', label: 'SEMI-OPEN', desc: 'Inference and connection' },
                  { color: '#7e22ce', label: 'MATH', desc: 'Numbers from the lesson' },
                  { color: '#2563eb', label: 'PRIOR KNOWLEDGE', desc: "What the student already knows" },
                  { color: '#db2777', label: 'OPEN', desc: "Student's own voice and perspective" },
                  { color: '#dc2626', label: 'VAKT', desc: 'Multisensory — video with QR code' },
                ].map(q => (
                  <div key={q.label} className="flex items-center gap-3">
                    <div className="w-14 shrink-0 text-center text-[10px] font-black py-0.5 rounded"
                      style={{ background: `${q.color}18`, color: q.color, border: `1px solid ${q.color}33` }}>
                      {q.label}
                    </div>
                    <p className="text-sm" style={{ color: '#7a6a5a' }}>{q.desc}</p>
                  </div>
                ))}
              </div>
              <a href="https://www.worduplessongenerator.com" target="_blank" rel="noopener noreferrer"
                className="inline-block font-semibold px-7 py-3.5 rounded-full transition-all hover:opacity-90 shadow-md"
                style={{ background: '#C9A435', color: '#2a1f17' }}>
                Visit the Lesson Generator →
              </a>
            </div>

            {/* Right: browser mockup */}
            <div className="md:sticky md:top-28">
              <LessonGeneratorMockup />
              <p className="text-center text-xs mt-3" style={{ color: '#a08060' }}>
                worduplessongenerator.com — live and free to browse
              </p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #d4c0a8, transparent)', margin: '0 4rem' }} />

      {/* Product 2: Practitioner Dashboard */}
      <section className="py-20" style={{ background: '#fdf9f4' }}>
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-14 items-start">

            {/* Left: description */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: '#C9A435' }}>Product Two</p>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#2a1f17' }}>Practitioner Dashboard</h2>
              <p className="text-sm font-medium mb-6" style={{ color: '#a08060' }}>Complete practice management system</p>
              <p className="leading-relaxed mb-8" style={{ color: '#5a4a3a', fontSize: '1.05rem' }}>
                This is not another lesson generator. The Practitioner Dashboard covers every step of your workflow — from the moment you plan a session to the moment you send a family their progress report.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { phase: 'Prepare', items: ['Choose or generate lessons', 'Build your session plan'] },
                  { phase: 'Teach', items: ['Run session timer', 'Record pokes in real time'] },
                  { phase: 'Measure', items: ['Automatic accuracy calculations', 'Accuracy history graph'] },
                  { phase: 'Document', items: ['Transcripts', 'Videos', 'Clinical notes', 'Invoices'] },
                  { phase: 'Communicate', items: ['Email families', 'Share progress reports'] },
                  { phase: 'Manage', items: ['Mileage', 'Income & Expenses', 'Calendar'] },
                ].map(s => (
                  <div key={s.phase} className="bg-white rounded-xl p-4 border shadow-sm" style={{ borderColor: '#ecdcc8' }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: '#C9A435' }}>{s.phase}</p>
                    <ul className="space-y-1.5">
                      {s.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs" style={{ color: '#5a4a3a' }}>
                          <span className="shrink-0 mt-0.5" style={{ color: '#C9A435' }}>✦</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <a href="/practitioner/get-started"
                className="inline-block font-semibold px-8 py-4 rounded-full transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#2a1f17', color: '#f5efe6' }}>
                Start Your Free Trial
              </a>
              <p className="text-xs mt-3" style={{ color: '#a08060' }}>30-day free trial · No charge until your trial ends</p>
            </div>

            {/* Right: dashboard mockup */}
            <div className="md:sticky md:top-28">
              <PractitionerDashboardMockup />
              <p className="text-center text-xs mt-3" style={{ color: '#a08060' }}>
                Student record — accuracy chart, session history, progress reports
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
