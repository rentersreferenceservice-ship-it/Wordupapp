import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStudentReportData } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { startDate, endDate } = await req.json()
  if (!startDate || !endDate) return Response.json({ error: 'startDate and endDate required' }, { status: 400 })

  const reportData = await getStudentReportData(studentId, userId, startDate, endDate)
  if (!reportData) return Response.json({ error: 'Student not found' }, { status: 404 })

  const { student, sessions, boardMilestones, questionTypeMilestones, regulationStats, topMisspokedLetters, accuracyTrend, financials } = reportData

  // Fetch observation form submissions within the reporting period
  const { data: rawSubs } = await getSupabase()
    .from('form_submissions')
    .select('*')
    .eq('student_id', studentId)
    .eq('practitioner_id', userId)
    .gte('submitted_at', startDate + 'T00:00:00')
    .lte('submitted_at', endDate + 'T23:59:59')
    .order('submitted_at', { ascending: true })

  const subs = rawSubs ?? []
  const eventLogs = subs.filter(s => s.form_type === 'practitioner_event_log')
  const energyLogs = subs.filter(s => s.form_type === 'session_energy_log')
  const familyLogs = subs.filter(s => s.form_type === 'family_event_log')

  // Split period in half to detect progression vs regression
  const midMs = (new Date(startDate).getTime() + new Date(endDate).getTime()) / 2
  const midDate = new Date(midMs).toISOString().slice(0, 10)
  const earlyEvents = eventLogs.filter(s => s.submitted_at < midDate + 'T')
  const lateEvents  = eventLogs.filter(s => s.submitted_at >= midDate + 'T')
  const earlyFamily = familyLogs.filter(s => s.submitted_at < midDate + 'T')
  const lateFamily  = familyLogs.filter(s => s.submitted_at >= midDate + 'T')

  // Accuracy impact: compare baseline vs post-event within each session
  type AccComp = { date: string; diff: number }
  const accuracyComparisons: AccComp[] = eventLogs
    .filter(s => s.form_data.baselineAccuracyPct && s.form_data.postEventAccuracyPct)
    .map(s => {
      const fd = s.form_data as Record<string, string>
      return {
        date: fd.date || s.submitted_at.slice(0, 10),
        diff: parseFloat(fd.postEventAccuracyPct) - parseFloat(fd.baselineAccuracyPct),
      }
    })

  // Build structured summary text for the report section and AI prompt
  const obsLines: string[] = []
  const hasObs = eventLogs.length > 0 || familyLogs.length > 0 || energyLogs.length > 0

  if (hasObs) {
    if (eventLogs.length) {
      obsLines.push(`Practitioner-documented neurological events: ${eventLogs.length} session(s)`)
      if (earlyEvents.length !== lateEvents.length && eventLogs.length > 1) {
        obsLines.push(`  Early period: ${earlyEvents.length} | Late period: ${lateEvents.length}`)
        obsLines.push(lateEvents.length < earlyEvents.length
          ? '  → Event frequency decreased over the period (positive trend)'
          : '  → Event frequency increased — closer monitoring recommended')
      }
    }

    if (familyLogs.length) {
      obsLines.push(`Family-reported episodes at home: ${familyLogs.length}`)
      if (earlyFamily.length !== lateFamily.length && familyLogs.length > 1) {
        obsLines.push(lateFamily.length < earlyFamily.length
          ? '  → Home episodes decreased over the period'
          : '  → Home episodes increased over the period')
      }
    }

    if (energyLogs.length) {
      obsLines.push(`Session energy & motor tracking forms completed: ${energyLogs.length}`)
    }

    if (accuracyComparisons.length) {
      const avgDiff = accuracyComparisons.reduce((sum, c) => sum + c.diff, 0) / accuracyComparisons.length
      if (avgDiff < -5)
        obsLines.push(`Post-event spelling accuracy: averaged ${Math.abs(avgDiff).toFixed(0)}% below baseline during events — motor impact observed`)
      else if (avgDiff >= -5 && avgDiff <= 5)
        obsLines.push(`Post-event spelling accuracy: remained near baseline during/after events`)
      else
        obsLines.push(`Post-event spelling accuracy: averaged ${avgDiff.toFixed(0)}% above baseline after events`)
    }

    // Key practitioner observations
    const practObs = eventLogs.map(s => (s.form_data as Record<string, string>).additionalObservations).filter(Boolean)
    if (practObs.length) {
      obsLines.push('Key practitioner observations:')
      practObs.forEach(o => obsLines.push(`  - ${o}`))
    }

    // Key family observations
    const famObs = familyLogs.map(s => (s.form_data as Record<string, string>).mostImportant).filter(Boolean)
    if (famObs.length) {
      obsLines.push('Key family observations:')
      famObs.forEach(o => obsLines.push(`  - ${o}`))
    }

    // Energy log summaries
    const energyObs = energyLogs.map(s => (s.form_data as Record<string, string>).additionalObservations).filter(Boolean)
    if (energyObs.length) {
      obsLines.push('Session energy notes:')
      energyObs.forEach(o => obsLines.push(`  - ${o}`))
    }
  }

  const observationsSummary = obsLines.join('\n')

  // Build prompt context
  const allNotes = sessions
    .filter(s => s.notes.trim())
    .map(s => `[${s.date}] ${s.notes}`)
    .join('\n')

  const prompt = `You are helping an S2C (Spelling to Communicate) practitioner write a progress report for a funding proposal.

Student: ${student.name} (${student.ageGroup})
Reporting period: ${startDate} to ${endDate}
Total sessions: ${sessions.length} | Completed: ${accuracyTrend.completedCount}

ACCURACY DATA:
- Starting accuracy: ${accuracyTrend.first !== null ? `${accuracyTrend.first}%` : 'N/A'}
- Ending accuracy: ${accuracyTrend.last !== null ? `${accuracyTrend.last}%` : 'N/A'}
- Average accuracy: ${accuracyTrend.average !== null ? `${accuracyTrend.average}%` : 'N/A'}
- Highest session: ${accuracyTrend.highest !== null ? `${accuracyTrend.highest}%` : 'N/A'}
${accuracyTrend.first !== null && accuracyTrend.last !== null ? `- Change: ${accuracyTrend.last > accuracyTrend.first ? '+' : ''}${accuracyTrend.last - accuracyTrend.first} points` : ''}

BOARD MILESTONES THIS PERIOD:
${boardMilestones.length ? boardMilestones.map(m => `- Advanced to ${m.board} (first noted: ${m.date})`).join('\n') : '- No board transitions noted in session notes'}

QUESTION TYPES INTRODUCED THIS PERIOD:
${questionTypeMilestones.length ? questionTypeMilestones.map(m => `- ${m.type} (first session: ${m.date})`).join('\n') : '- No new question types introduced'}

REGULATION PATTERNS (${sessions.filter(s => s.regulationArrival).length} sessions with regulation data):
- Arrived regulated: ${regulationStats.arrivedRegulated} sessions
- Arrived dysregulated, regulated by end (positive): ${regulationStats.improvedByEnd} sessions
- Arrived dysregulated, remained dysregulated: ${regulationStats.ongoingConcern} sessions

FINANCIALS:
- Sessions completed: ${financials.completedSessions}
- Session rate: ${financials.sessionRate != null ? `$${financials.sessionRate}` : 'not set'}
- Total billed this period: ${financials.totalBilled > 0 ? `$${financials.totalBilled.toFixed(2)}` : 'no invoices'}
- Frequency: Twice weekly

${topMisspokedLetters.length ? `MOST CHALLENGING LETTERS (approximated from misspoked words):\n${topMisspokedLetters.map(l => `- Letter ${l.letter}: ${l.count} weighted misspokes`).join('\n')}` : ''}

NEUROLOGICAL OBSERVATION FINDINGS:
${observationsSummary || 'No observation forms submitted for this period.'}

SESSION NOTES:
${allNotes || 'No session notes recorded for this period.'}

---
Write TWO sections for a professional funding proposal. Where observation data is present, weave the neurological findings and progression/regression trends naturally into the narrative — mention event frequency changes, motor impact on spelling, and whether sessions showed improvement or concern over the period.

PROGRESS NARRATIVE:
Write 2-3 paragraphs describing this student's progress. Be warm, professional, and specific. Reference accuracy numbers, milestones, and regulation patterns where relevant. Frame dysregulation that improved as a positive sign. Use language appropriate for funders and school teams.

RECOMMENDED GOALS:
Write 3-5 specific, measurable goals for the next reporting period. Base goals on the S2C progression framework:
- If accuracy is below 90%, goal should be to reach 90% for 4 consecutive sessions
- If consistently at 90%+, goal should be to advance to the next board or question type
- If dysregulation on arrival is a pattern, include a regulation goal
- Reference specific next steps in the S2C sequence (board progression, question type advancement)

Format exactly as:
PROGRESS NARRATIVE:
[text]

RECOMMENDED GOALS:
[text]`

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = (message.content[0] as { type: string; text: string }).text ?? ''
  const narrativeMatch = responseText.match(/PROGRESS NARRATIVE:\s*([\s\S]*?)(?=RECOMMENDED GOALS:|$)/)
  const goalsMatch = responseText.match(/RECOMMENDED GOALS:\s*([\s\S]*)$/)

  return Response.json({
    reportData,
    narrative: narrativeMatch?.[1]?.trim() ?? '',
    goals: goalsMatch?.[1]?.trim() ?? '',
    observationsSummary,
  })
}
