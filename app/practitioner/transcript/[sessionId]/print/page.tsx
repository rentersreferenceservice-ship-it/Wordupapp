import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription, getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const QUESTION_COLORS: Record<string, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

export default async function TranscriptPrintPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/pricing')

  const sub = await getPractitionerSubscription(userId)
  if (!sub) redirect('/practitioner/pricing')

  const { data: session } = await getSupabase()
    .from('sessions').select('*').eq('id', sessionId).eq('practitioner_id', userId).single()
  if (!session) redirect('/practitioner/dashboard')

  const { data: studentData } = await getSupabase()
    .from('students').select('name, age_group').eq('id', session.student_id).single()

  const responses = await getSessionResponses(sessionId)

  const byHunk: Record<number, typeof responses> = {}
  for (const r of responses) {
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const keywords = responses.filter(r => r.questionType === 'KEYWORD')
  const totalLetters = keywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0)
  const totalMisspokes = keywords.reduce((sum, k) => sum + (k.misspokeCount ?? 0), 0)
  const misspokePct = totalLetters > 0 ? Math.round((totalMisspokes / totalLetters) * 100) : 0
  const correctPct = 100 - misspokePct

  return (
    <html>
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 8.5pt; line-height: 1.2; color: #111; background: white; }
          @page { margin: 0.4in; size: letter; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 2px solid #111; }
          .header img { width: 60px; }
          .header-right { text-align: right; font-size: 7.5pt; }
          .stats { display: flex; gap: 16px; margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid #ddd; }
          .stat { text-align: center; }
          .stat-val { font-size: 13pt; font-weight: bold; }
          .stat-label { font-size: 6.5pt; color: #555; }
          .hunk { margin-bottom: 6px; border: 1px solid #ccc; border-radius: 3px; padding: 4px 6px; }
          .hunk-title { font-size: 7pt; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 3px; }
          .keywords { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 4px; }
          .kw { display: inline-flex; align-items: center; gap: 3px; padding: 1px 5px; border-radius: 3px; font-size: 7.5pt; font-weight: bold; }
          .kw-ok { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .kw-bad { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
          .kw-letters { font-size: 6.5pt; color: #888; font-weight: normal; }
          .kw-miss { font-size: 6.5pt; color: #dc2626; }
          .questions { display: flex; flex-direction: column; gap: 2px; }
          .q { display: flex; align-items: baseline; gap: 4px; }
          .q-badge { font-size: 6pt; font-weight: bold; color: white; padding: 0px 3px; border-radius: 2px; white-space: nowrap; flex-shrink: 0; }
          .q-text { font-size: 7.5pt; }
          .q-answer { font-size: 7pt; color: #555; margin-left: 2px; }
          .footer { margin-top: 8px; text-align: center; font-size: 6.5pt; color: #aaa; border-top: 1px solid #eee; padding-top: 4px; }
        `}</style>
        <script>{`window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 600); }`}</script>
      </head>
      <body>
        <div className="header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,paddingBottom:6,borderBottom:'2px solid #111'}}>
          <div>
            <img src="/word_up_clean.jpeg" alt="Word Up" style={{width:60,marginBottom:2}} />
            <div style={{fontSize:'11pt',fontWeight:'bold'}}>Session Transcript</div>
            <div style={{fontSize:'8pt',color:'#555'}}>{session.lesson_title}</div>
          </div>
          <div style={{textAlign:'right',fontSize:'7.5pt'}}>
            <div><strong>Student:</strong> {studentData?.name}</div>
            <div><strong>Age Group:</strong> {studentData?.age_group}</div>
            <div><strong>Date:</strong> {new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:24,marginBottom:8,paddingBottom:6,borderBottom:'1px solid #ddd'}}>
          {[
            { val: totalLetters, label: 'Total Letters Poked', color: '#2563eb' },
            { val: totalMisspokes, label: 'Total Misspokes', color: '#dc2626' },
            { val: `${correctPct}%`, label: `Correct / ${misspokePct}% misspoke`, color: '#15803d' },
          ].map((s, i) => (
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:'14pt',fontWeight:'bold',color:s.color}}>{s.val}</div>
              <div style={{fontSize:'6.5pt',color:'#555'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {Object.entries(byHunk).sort(([a],[b]) => Number(a)-Number(b)).map(([hunkNum, items]) => {
          const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD')
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD')
          return (
            <div key={hunkNum} style={{marginBottom:5,border:'1px solid #ccc',borderRadius:3,padding:'3px 6px'}}>
              <div style={{fontSize:'7pt',fontWeight:'bold',color:'#888',textTransform:'uppercase',marginBottom:3}}>Hunk {hunkNum}</div>

              {hunkKeywords.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:3}}>
                  {hunkKeywords.map((k, i) => (
                    <span key={i} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'1px 5px',borderRadius:3,fontSize:'7.5pt',fontWeight:'bold',background:(k.misspokeCount??0)>0?'#fef2f2':'#f0fdf4',border:`1px solid ${(k.misspokeCount??0)>0?'#fecaca':'#bbf7d0'}`}}>
                      {k.keyword}
                      <span style={{fontSize:'6.5pt',color:'#888',fontWeight:'normal'}}>{(k.keyword??'').replace(/\s/g,'').length}L</span>
                      {(k.misspokeCount??0)>0 && <span style={{fontSize:'6.5pt',color:'#dc2626'}}>{k.misspokeCount}✗</span>}
                      {(k.misspokeCount??0)===0 && <span style={{fontSize:'6.5pt',color:'#15803d'}}>✓</span>}
                    </span>
                  ))}
                </div>
              )}

              {hunkQuestions.map((q, i) => {
                const color = QUESTION_COLORS[q.questionType] ?? '#666'
                return (
                  <div key={i} style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:1}}>
                    <span style={{fontSize:'6pt',fontWeight:'bold',color:'white',background:color,padding:'0 3px',borderRadius:2,whiteSpace:'nowrap',flexShrink:0}}>{q.questionType}</span>
                    <span style={{fontSize:'7.5pt'}}>{q.questionText}</span>
                    {q.capturedAnswer && q.capturedAnswer !== 'SKIP' && q.capturedAnswer !== 'COMPLETED' && (
                      <span style={{fontSize:'7pt',color:'#555'}}>→ {q.capturedAnswer}</span>
                    )}
                    {q.capturedAnswer === 'SKIP' && <span style={{fontSize:'7pt',color:'#aaa'}}>skipped</span>}
                    {q.capturedAnswer === 'COMPLETED' && <span style={{fontSize:'7pt',color:'#15803d'}}>✓</span>}
                    {(q.misspokeCount ?? 0) > 0 && <span style={{fontSize:'7pt',color:'#dc2626'}}>{q.misspokeCount}✗</span>}
                  </div>
                )
              })}
            </div>
          )
        })}

        <div style={{marginTop:8,textAlign:'center',fontSize:'6.5pt',color:'#aaa',borderTop:'1px solid #eee',paddingTop:4}}>
          Word Up S2C Lesson Generator — worduplessongenerator.com
        </div>
      </body>
    </html>
  )
}
