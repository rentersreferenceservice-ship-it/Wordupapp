import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSessionResponses, getStudentAccuracyHistory } from '@/lib/practitionerStore'
import type { SessionAccuracy } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'

function AccuracyChartSVG({ data }: { data: SessionAccuracy[] }) {
  if (data.length < 2) {
    if (data.length === 1) return (
      <div style={{textAlign:'center',padding:'6px 0'}}>
        <span style={{fontSize:'13pt',fontWeight:'bold',color:'#2563eb'}}>{data[0].accuracy}%</span>
        <span style={{fontSize:'8pt',color:'#888',marginLeft:8}}>First session — more sessions will show a trend</span>
      </div>
    )
    return null
  }
  const W = 480, H = 90
  const padL = 32, padR = 10, padT = 8, padB = 22
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * plotW,
    y: padT + (1 - d.accuracy / 100) * plotH,
    accuracy: d.accuracy,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const step = Math.max(1, Math.floor(data.length / 5))
  const xIdxs = [...new Set([0, ...[1,2,3,4].map(n => n * step), data.length - 1])].filter(i => i < data.length)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block'}}>
      {[0,50,100].map(pct => {
        const y = (padT + (1 - pct / 100) * plotH).toFixed(1)
        return (
          <g key={pct}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eeeeee" strokeWidth="1"/>
            <text x={padL - 3} y={Number(y) + 3} fontSize="7" fill="#aaaaaa" textAnchor="end">{pct}%</text>
          </g>
        )
      })}
      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="1.5"/>
      {pts.map((p, i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="#2563eb"/>)}
      {xIdxs.map(i => (
        <text key={i} x={pts[i].x.toFixed(1)} y={H - 4} fontSize="7" fill="#aaaaaa" textAnchor="middle">{pts[i].label}</text>
      ))}
    </svg>
  )
}

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


  const { data: session } = await getSupabase()
    .from('sessions').select('*').eq('id', sessionId).eq('practitioner_id', userId).single()
  if (!session) redirect('/practitioner/dashboard')

  const { data: studentData } = await getSupabase()
    .from('students').select('name, age_group').eq('id', session.student_id).single()

  const [responses, accuracyHistory] = await Promise.all([
    getSessionResponses(sessionId),
    getStudentAccuracyHistory(session.student_id, userId),
  ])

  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')

  const byHunk: Record<number, typeof responses> = {}
  for (const r of responses) {
    if (r.hunkNumber == null || r.hunkNumber <= 0) continue
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const spellKeywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
  const spellKnown = responses.filter(r => r.questionType === 'KNOWN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const totalLetters =
    spellKeywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
    spellKnown.reduce((sum, q) => sum + (q.expectedAnswer ?? '').split('/').reduce((s, a) => s + a.trim().replace(/\s/g, '').length, 0), 0)
  const totalMisspokes =
    [...spellKeywords, ...spellKnown].reduce((sum, r) => sum + (r.misspokeCount ?? 0), 0)
  const totalPokes = totalLetters + totalMisspokes
  const correctPct = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : 0
  const misspokePct = totalPokes > 0 ? 100 - correctPct : 0

  const mathAsked = responses.filter(r => r.questionType === 'MATH' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const mathAnswered = mathAsked.filter(r => r.capturedAnswer === 'correct' || r.capturedAnswer === 'incorrect')
  const mathCorrect = mathAnswered.filter(r => r.capturedAnswer === 'correct').length
  const openAsked = responses.filter(r => (r.questionType === 'OPEN' || r.questionType === 'PRIOR KNOWLEDGE') && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const openAnsweredItems = openAsked.filter(r => r.capturedAnswer && r.capturedAnswer.trim() !== '')
  const openAnswered = openAnsweredItems.length
  const openLetters = openAnsweredItems.reduce((sum, r) => sum + (r.capturedAnswer ?? '').replace(/\s/g, '').length, 0)
  const openMisspokes = openAnsweredItems.reduce((sum, r) => sum + (r.misspokeCount ?? 0), 0)
  const openPokes = openLetters + openMisspokes

  return (
    <html>
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #111; background: white; }
          @page { margin: 0.75in; size: letter; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #111; }
          .header img { width: 80px; }
          .header-right { text-align: right; font-size: 10pt; }
          .stats { display: flex; gap: 24px; margin-bottom: 14px; padding: 8px 0; border-bottom: 1px solid #ddd; }
          .stat { text-align: center; }
          .stat-val { font-size: 18pt; font-weight: bold; }
          .stat-label { font-size: 9pt; color: #555; }
          .hunk { margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; padding: 8px 10px; }
          .hunk-title { font-size: 9pt; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 6px; }
          .keywords { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
          .kw { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 10pt; font-weight: bold; }
          .kw-ok { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .kw-bad { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
          .kw-letters { font-size: 8.5pt; color: #888; font-weight: normal; }
          .kw-miss { font-size: 8.5pt; color: #dc2626; }
          .questions { display: flex; flex-direction: column; gap: 4px; }
          .q { display: flex; align-items: baseline; gap: 6px; }
          .q-badge { font-size: 8pt; font-weight: bold; color: white; padding: 1px 5px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; }
          .q-text { font-size: 10pt; }
          .q-answer { font-size: 9pt; color: #555; margin-left: 2px; }
          .footer { margin-top: 14px; text-align: center; font-size: 9pt; color: #aaa; border-top: 1px solid #eee; padding-top: 6px; }
        `}</style>
        <script>{`window.onload = function() { setTimeout(function() { window.print(); }, 600); }`}</script>
      </head>
      <body>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,paddingBottom:10,borderBottom:'2px solid #111'}}>
          <div>
            <img src="/word_up_clean.jpeg" alt="Word Up" style={{width:80,marginBottom:4}} />
            <div style={{fontSize:'14pt',fontWeight:'bold'}}>Session Transcript</div>
            <div style={{fontSize:'10pt',color:'#555'}}>{session.lesson_title}</div>
          </div>
          <div style={{textAlign:'right',fontSize:'10pt'}}>
            <div><strong>Student:</strong> {studentData?.name}</div>
            <div><strong>Age Group:</strong> {studentData?.age_group}</div>
            <div><strong>Date:</strong> {new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:32,marginBottom:10,paddingBottom:10,borderBottom: mathAnswered.length === 0 && openAsked.length === 0 ? '1px solid #ddd' : 'none'}}>
          {[
            { val: totalLetters, label: 'Letters to Poke', color: '#2563eb' },
            { val: totalMisspokes, label: 'Misspokes', color: '#dc2626' },
            { val: `${correctPct}%`, label: `Accuracy (${misspokePct}% error)`, color: '#15803d' },
          ].map((s, i) => (
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:'18pt',fontWeight:'bold',color:s.color}}>{s.val}</div>
              <div style={{fontSize:'9pt',color:'#555'}}>{s.label}</div>
            </div>
          ))}
        </div>
        {(mathAnswered.length > 0 || openAsked.length > 0) && (
          <div style={{display:'flex',gap:24,marginBottom:14,paddingBottom:10,borderBottom:'1px solid #ddd'}}>
            {mathAnswered.length > 0 && (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'16pt',fontWeight:'bold',color:'#7e22ce'}}>{mathCorrect}/{mathAnswered.length}</div>
                <div style={{fontSize:'9pt',color:'#7e22ce'}}>Math Correct</div>
              </div>
            )}
            {openAsked.length > 0 && (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'16pt',fontWeight:'bold',color:'#db2777'}}>{openAnswered}/{openAsked.length}</div>
                <div style={{fontSize:'9pt',color:'#db2777'}}>Open Responses</div>
                {openPokes > 0 && <div style={{fontSize:'8pt',color:'#db2777'}}>{openLetters}L · {openMisspokes}✗ · {openPokes} pokes</div>}
              </div>
            )}
          </div>
        )}

        {accuracyHistory.length > 0 && (
          <div style={{marginBottom:12,paddingBottom:10,borderBottom:'1px solid #ddd'}}>
            <div style={{fontSize:'8pt',fontWeight:'bold',color:'#888',textTransform:'uppercase',marginBottom:4}}>Accuracy — Past 12 Months</div>
            <AccuracyChartSVG data={accuracyHistory} />
          </div>
        )}

        {(sessionStateRecord?.capturedAnswer || sessionNotesRecord?.capturedAnswer) && (
          <div style={{marginBottom:12,paddingBottom:10,borderBottom:'1px solid #ddd'}}>
            {sessionStateRecord?.capturedAnswer && (
              <div style={{marginBottom:6}}>
                <span style={{fontSize:'9pt',fontWeight:'bold',color:'#555',textTransform:'uppercase',marginRight:8}}>Student State:</span>
                {sessionStateRecord.capturedAnswer.split(', ').filter(Boolean).map((s, i) => (
                  <span key={i} style={{display:'inline-block',marginRight:5,padding:'1px 8px',background:'#eef2ff',border:'1px solid #c7d2fe',borderRadius:10,fontSize:'9pt',color:'#4338ca',fontWeight:'bold'}}>{s}</span>
                ))}
              </div>
            )}
            {sessionNotesRecord?.capturedAnswer && (
              <div>
                <span style={{fontSize:'9pt',fontWeight:'bold',color:'#555',textTransform:'uppercase'}}>Notes: </span>
                <span style={{fontSize:'10pt',color:'#333'}}>{sessionNotesRecord.capturedAnswer}</span>
              </div>
            )}
          </div>
        )}

        {Object.entries(byHunk).sort(([a],[b]) => Number(a)-Number(b)).map(([hunkNum, items]) => {
          const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED')
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD' && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIP')
          if (hunkKeywords.length === 0 && hunkQuestions.length === 0) return null
          return (
            <div key={hunkNum} style={{marginBottom:10,border:'1px solid #ccc',borderRadius:4,padding:'8px 10px'}}>
              <div style={{fontSize:'9pt',fontWeight:'bold',color:'#888',textTransform:'uppercase',marginBottom:6}}>Hunk {hunkNum}</div>

              {hunkKeywords.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:8}}>
                  {hunkKeywords.map((k, i) => (
                    <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:4,fontSize:'10pt',fontWeight:'bold',background:(k.misspokeCount??0)>0?'#fef2f2':'#f0fdf4',border:`1px solid ${(k.misspokeCount??0)>0?'#fecaca':'#bbf7d0'}`}}>
                      {k.keyword}
                      <span style={{fontSize:'8.5pt',color:'#888',fontWeight:'normal'}}>{(k.keyword??'').replace(/\s/g,'').length}L</span>
                      {(k.misspokeCount??0)>0 && <span style={{fontSize:'8.5pt',color:'#dc2626'}}>{k.misspokeCount}✗</span>}
                      {(k.misspokeCount??0)===0 && <span style={{fontSize:'8.5pt',color:'#15803d'}}>✓</span>}
                    </span>
                  ))}
                </div>
              )}

              {hunkQuestions.map((q, i) => {
                const color = QUESTION_COLORS[q.questionType] ?? '#666'
                const notAsked = q.capturedAnswer === 'NOT_ASKED'
                const skipped = q.capturedAnswer === 'SKIP'
                const completed = q.capturedAnswer === 'COMPLETED'
                const isMathType = q.questionType === 'MATH'
                const hasTextAnswer = q.capturedAnswer && !notAsked && !skipped && !completed && !isMathType
                const misspokes = q.misspokeCount ?? 0
                const isOpenType = q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE'
                return (
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:6,marginBottom:5}}>
                    <span style={{fontSize:'8pt',fontWeight:'bold',color:color,border:`1.5px solid ${color}`,padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap',flexShrink:0}}>{q.questionType}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:'10pt',fontWeight:500,color:notAsked?'#aaa':color,opacity:notAsked?0.6:1,fontStyle:notAsked?'italic':'normal'}}>{q.questionText}</span>
                      {notAsked && <span style={{fontSize:'9pt',color:'#aaa',fontStyle:'italic'}}> (not asked)</span>}
                      {skipped && <span style={{fontSize:'9pt',color:'#aaa'}}> skipped</span>}
                      {completed && <span style={{fontSize:'9pt',color:'#15803d'}}> ✓</span>}
                      {isMathType && !notAsked && !skipped && q.capturedAnswer && (
                        <span style={{fontSize:'9pt',fontWeight:'bold',color:q.capturedAnswer==='correct'?'#15803d':'#dc2626'}}> {q.capturedAnswer==='correct'?'✓ Correct':'✗ Incorrect'}</span>
                      )}
                      {isMathType && !notAsked && !skipped && !q.capturedAnswer && q.expectedAnswer && (
                        <span style={{fontSize:'9pt',color:'#999'}}> {q.expectedAnswer}</span>
                      )}
                      {hasTextAnswer && <span style={{fontSize:'9pt',color:'#555'}}> → {q.capturedAnswer}</span>}
                      {!hasTextAnswer && !isMathType && !notAsked && !skipped && !completed && q.expectedAnswer && (
                        <span style={{fontSize:'9pt',color:'#999'}}> {q.expectedAnswer}</span>
                      )}
                      {misspokes > 0 && !notAsked && <span style={{fontSize:'9pt',color:'#dc2626',fontWeight:'bold'}}> {'✗'.repeat(misspokes)}</span>}
                      {!notAsked && !skipped && (
                        <div style={{marginTop:6}}>
                          <div style={{borderBottom:'1px solid #bbb',marginBottom:8,height:16}} />
                          {isOpenType && <>
                            <div style={{borderBottom:'1px solid #bbb',marginBottom:8,height:16}} />
                            <div style={{borderBottom:'1px solid #bbb',marginBottom:8,height:16}} />
                            <div style={{borderBottom:'1px solid #bbb',height:16}} />
                          </>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div style={{marginTop:14,textAlign:'center',fontSize:'9pt',color:'#aaa',borderTop:'1px solid #eee',paddingTop:6}}>
          Word Up S2C Lesson Generator — worduplessongenerator.com
        </div>
      </body>
    </html>
  )
}
