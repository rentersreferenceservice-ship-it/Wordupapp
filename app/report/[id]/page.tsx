import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function SharedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabase()

  const { data: report } = await supabase
    .from('progress_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Report not found.</p>
      </main>
    )
  }

  const [{ data: student }, { data: settingsRow }] = await Promise.all([
    supabase.from('students').select('name').eq('id', report.student_id).single(),
    supabase.from('practitioner_settings').select('business_name, business_address, business_phone, business_email, logo_url, website_url').eq('practitioner_id', report.practitioner_id).single(),
  ])

  const sc = report.sections_content ?? {}
  const sv = report.sections_visible ?? {}
  const show = {
    stats: sv.stats !== false,
    milestones: sv.milestones !== false,
    regulation: sv.regulation !== false,
    letters: sv.letters !== false,
    financials: sv.financials !== false,
    narrative: sv.narrative !== false,
    goals: sv.goals !== false,
  }

  const studentName = student?.name ?? 'Student'
  const startDate = report.start_date
  const endDate = report.end_date
  const periodLabel = `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

  const s = settingsRow

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="max-w-3xl mx-auto">
        <div className="no-print mb-6 flex justify-end">
          <button onClick={undefined} className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors" id="printBtn">
            Print / Save as PDF
          </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('printBtn').addEventListener('click', () => window.print())` }} />

        {/* Business header */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 flex items-start justify-between">
          <div>
            {s?.logo_url && <img src={s.logo_url} alt="Logo" className="h-12 object-contain mb-2" />}
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Progress Report</div>
            {s?.business_name && <div className="text-base font-bold text-gray-900">{s.business_name}</div>}
            {s?.business_address && <div className="text-xs text-gray-500 whitespace-pre-line">{s.business_address}</div>}
            {s?.business_phone && <div className="text-xs text-gray-500">{s.business_phone}</div>}
            {s?.business_email && <div className="text-xs text-gray-500">{s.business_email}</div>}
            {s?.website_url && <div className="text-xs text-blue-600">{s.website_url}</div>}
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-gray-900">{studentName}</div>
            <div className="text-xs text-gray-500 mt-1">{periodLabel}</div>
          </div>
        </div>

        {/* Stats */}
        {show.stats && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Accuracy Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Sessions', value: sc.statSessions, color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Avg Accuracy', value: sc.statAvg, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Progress', value: sc.statProgress, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                { label: 'Best Session', value: sc.statBest, color: 'text-purple-700', bg: 'bg-purple-50' },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value || '—'}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {show.milestones && sc.milestones && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Milestones This Period</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{sc.milestones}</p>
          </div>
        )}

        {show.regulation && sc.regulation && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Regulation</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{sc.regulation}</p>
          </div>
        )}

        {show.letters && sc.letters && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Most Misspoked Letters</h2>
            <p className="text-lg font-bold font-mono text-red-700 tracking-widest">{sc.letters}</p>
          </div>
        )}

        {show.financials && (sc.finSessions || sc.finRate || sc.finTotal) && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Session & Funding Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Sessions Completed', value: sc.finSessions },
                { label: 'Sessions / Wk', value: sc.finFrequency },
                { label: 'Session Rate', value: sc.finRate ? '$' + sc.finRate : '' },
                { label: 'Projected Annual Total', value: sc.finTotal ? '$' + sc.finTotal : '' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{item.value || '—'}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {show.narrative && report.narrative && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Progress Narrative</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{report.narrative}</p>
          </div>
        )}

        {show.goals && report.goals && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">Recommended Goals</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{report.goals}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-4">Word Up S2C · worduplessongenerator.com</p>
      </div>
    </main>
  )
}
