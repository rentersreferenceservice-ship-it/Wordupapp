import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStudentReportData } from '@/lib/practitionerStore'
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

SESSION NOTES:
${allNotes || 'No session notes recorded for this period.'}

---
Write TWO sections for a professional funding proposal:

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
  })
}
