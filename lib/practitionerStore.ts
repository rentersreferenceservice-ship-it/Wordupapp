import { getSupabase } from './supabase'

export type PractitionerTier = 'standard' | 'agency'
export type BillingPeriod = 'monthly' | 'annual'

export const PLAN_PRICE = { monthly: 2999, annual: 30589 } // $29.99/mo, $305.89/yr (~15% off)

export interface PractitionerSubscription {
  userId: string
  tier: PractitionerTier
  studentLimit: number
  isActive: boolean
  billingPeriod: BillingPeriod
}

export interface Student {
  id: string
  practitionerId: string
  name: string
  ageGroup: string
  notes: string
  guardianEmail: string
  funderName: string
  funderEmail: string
  sessionRate: number | null
  createdAt: string
}

export interface Session {
  id: string
  practitionerId: string
  studentId: string
  lessonId: string
  lessonTitle: string
  sessionDate: string
  boardLevel: string | null
  createdAt: string
}

export const BOARD_LEVELS = ['3-Board', '26-Board', 'Laminate Board', 'Stencil Board', 'Keyboard'] as const

export interface SavedReport {
  id: string
  startDate: string
  endDate: string
  createdAt: string
  narrative: string
  goals: string
  sectionsContent: Record<string, string>
  sectionsVisible: Record<string, boolean>
  reportData: StudentReportData
}

export interface SessionResponse {
  id: string
  sessionId: string
  hunkNumber: number | null
  keyword?: string
  misspokeCount?: number
  questionType: string
  questionText: string
  expectedAnswer?: string
  capturedAnswer?: string
  spellerSentence?: string
}

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function getPractitionerSubscription(userId: string): Promise<PractitionerSubscription | null> {
  if (userId === ADMIN_USER_ID) {
    return { userId, tier: 'agency', studentLimit: 100, isActive: true, billingPeriod: 'monthly' }
  }
  const { data } = await getSupabase()
    .from('practitioner_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  if (!data) return null
  return {
    userId: data.user_id,
    tier: data.tier,
    studentLimit: data.student_limit,
    isActive: data.is_active,
    billingPeriod: data.billing_period,
  }
}

export async function setPractitionerSubscription(
  userId: string,
  billingPeriod: BillingPeriod,
  active: boolean
): Promise<void> {
  await getSupabase().from('practitioner_subscriptions').upsert({
    user_id: userId,
    tier: 'standard',
    student_limit: 999,
    is_active: active,
    billing_period: billingPeriod,
  })
}

export async function getStudents(practitionerId: string): Promise<Student[]> {
  const { data } = await getSupabase()
    .from('students')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('name')
  return (data ?? []).map(d => ({
    id: d.id,
    practitionerId: d.practitioner_id,
    name: d.name,
    ageGroup: d.age_group,
    notes: d.notes ?? '',
    guardianEmail: d.guardian_email ?? '',
    funderName: d.funder_name ?? '',
    funderEmail: d.funder_email ?? '',
    sessionRate: d.session_rate ?? null,
    createdAt: d.created_at,
  }))
}

export async function getStudent(id: string): Promise<Student | null> {
  const { data } = await getSupabase().from('students').select('*').eq('id', id).single()
  if (!data) return null
  return {
    id: data.id,
    practitionerId: data.practitioner_id,
    name: data.name,
    ageGroup: data.age_group,
    notes: data.notes ?? '',
    guardianEmail: data.guardian_email ?? '',
    funderName: data.funder_name ?? '',
    funderEmail: data.funder_email ?? '',
    sessionRate: data.session_rate ?? null,
    createdAt: data.created_at,
  }
}

export async function createStudent(practitionerId: string, name: string, ageGroup: string, notes: string, guardianEmail = ''): Promise<Student> {
  const { data } = await getSupabase().from('students').insert({
    practitioner_id: practitionerId,
    name,
    age_group: ageGroup,
    notes,
    guardian_email: guardianEmail,
  }).select().single()
  return {
    id: data.id,
    practitionerId: data.practitioner_id,
    name: data.name,
    ageGroup: data.age_group,
    notes: data.notes ?? '',
    guardianEmail: data.guardian_email ?? '',
    funderName: data.funder_name ?? '',
    funderEmail: data.funder_email ?? '',
    sessionRate: data.session_rate ?? null,
    createdAt: data.created_at,
  }
}

export async function updateStudent(id: string, name: string, ageGroup: string, notes: string, guardianEmail = '', funderName = '', funderEmail = '', sessionRate: number | null = null): Promise<void> {
  await getSupabase().from('students').update({
    name,
    age_group: ageGroup,
    notes,
    guardian_email: guardianEmail,
    funder_name: funderName || null,
    funder_email: funderEmail || null,
    session_rate: sessionRate,
  }).eq('id', id)
}

export async function deleteStudent(id: string): Promise<void> {
  await getSupabase().from('students').delete().eq('id', id)
}

export async function getSessions(practitionerId: string, studentId?: string): Promise<Session[]> {
  let query = getSupabase().from('sessions').select('id, practitioner_id, student_id, lesson_id, lesson_title, session_date, board_level, created_at').eq('practitioner_id', practitionerId)
  if (studentId) query = query.eq('student_id', studentId)
  const { data } = await query.order('session_date', { ascending: false })
  return (data ?? []).map(d => ({
    id: d.id,
    practitionerId: d.practitioner_id,
    studentId: d.student_id,
    lessonId: d.lesson_id,
    lessonTitle: d.lesson_title,
    sessionDate: d.session_date,
    boardLevel: d.board_level ?? null,
    createdAt: d.created_at,
  }))
}

export async function createSession(
  practitionerId: string,
  studentId: string,
  lessonId: string,
  lessonTitle: string,
  sessionDate: string,
  boardLevel: string | null = null
): Promise<string> {
  const { data } = await getSupabase().from('sessions').insert({
    practitioner_id: practitionerId,
    student_id: studentId,
    lesson_id: lessonId,
    lesson_title: lessonTitle,
    session_date: sessionDate,
    board_level: boardLevel,
  }).select().single()
  return data.id
}

export async function updateSessionBoardLevel(sessionId: string, boardLevel: string | null): Promise<void> {
  await getSupabase().from('sessions').update({ board_level: boardLevel }).eq('id', sessionId)
}

export async function getLastBoardLevel(studentId: string, practitionerId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('sessions')
    .select('board_level')
    .eq('student_id', studentId)
    .eq('practitioner_id', practitionerId)
    .not('board_level', 'is', null)
    .order('session_date', { ascending: false })
    .limit(1)
    .single()
  return (data as { board_level: string | null } | null)?.board_level ?? null
}

export async function saveSessionResponses(sessionId: string, responses: Omit<SessionResponse, 'id' | 'sessionId'>[]): Promise<void> {
  if (responses.length === 0) return

  // Deduplicate EXTRA_SPELLING rows — the Edit Transcript client historically sent
  // each extra keyword twice (once from the main response loop, once from the
  // extraKeywords loop), causing the count to double on every save.
  const seenExtra = new Set<string>()
  const deduped = responses.filter(r => {
    if (r.questionType !== 'EXTRA_SPELLING') return true
    const word = (r.keyword ?? '').trim()
    if (!word) return false
    const key = `${r.hunkNumber}:${word.toUpperCase()}`
    if (seenExtra.has(key)) return false
    seenExtra.add(key)
    return true
  })

  // Separate special session-level records (hunkNumber 0) from regular hunk responses.
  // Insert regular records first, then special ones — so a constraint on hunk_number
  // doesn't wipe the session data.
  const regularRows = deduped.filter(r => (r.hunkNumber ?? 0) > 0)
  const specialRows = deduped.filter(r => (r.hunkNumber ?? 0) === 0)

  const toRow = (r: Omit<SessionResponse, 'id' | 'sessionId'>) => ({
    session_id: sessionId,
    hunk_number: (r.hunkNumber ?? 0) > 0 ? r.hunkNumber : -1,
    keyword: r.keyword ?? null,
    misspoke_count: r.misspokeCount ?? 0,
    question_type: r.questionType,
    question_text: r.questionText,
    expected_answer: r.expectedAnswer ?? null,
    captured_answer: r.capturedAnswer ?? null,
    speller_sentence: r.spellerSentence ?? null,
  })

  const { error: deleteError } = await getSupabase()
    .from('session_responses').delete().eq('session_id', sessionId)
  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`)

  if (regularRows.length > 0) {
    const { error } = await getSupabase().from('session_responses').insert(regularRows.map(toRow))
    if (error) throw new Error(`Insert failed: ${error.message}`)
  }

  if (specialRows.length > 0) {
    const { error } = await getSupabase().from('session_responses').insert(specialRows.map(toRow))
    if (error) throw new Error(`Notes/state save failed: ${error.message}`)
  }
}

export async function getCompletedSessionIds(sessionIds: string[]): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set()
  const { data } = await getSupabase()
    .from('session_responses')
    .select('session_id')
    .in('session_id', sessionIds)
    .eq('question_type', 'SESSION_COMPLETE')
  return new Set((data ?? []).map((d: { session_id: string }) => d.session_id))
}

export interface CRP {
  id: string
  studentId: string
  practitionerId: string
  name: string
  color: string
  createdAt: string
}

export const CRP_COLORS = ['#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0891b2', '#ca8a04']

export async function getCrps(studentId: string, practitionerId: string): Promise<CRP[]> {
  const { data } = await getSupabase()
    .from('crps')
    .select('*')
    .eq('student_id', studentId)
    .eq('practitioner_id', practitionerId)
    .order('created_at')
  return (data ?? []).map(d => ({
    id: d.id,
    studentId: d.student_id,
    practitionerId: d.practitioner_id,
    name: d.name,
    color: d.color,
    createdAt: d.created_at,
  }))
}

export async function createCrp(studentId: string, practitionerId: string, name: string, color: string): Promise<CRP> {
  const { data } = await getSupabase().from('crps').insert({
    student_id: studentId,
    practitioner_id: practitionerId,
    name,
    color,
  }).select().single()
  return {
    id: data.id,
    studentId: data.student_id,
    practitionerId: data.practitioner_id,
    name: data.name,
    color: data.color,
    createdAt: data.created_at,
  }
}

export async function deleteCrp(id: string): Promise<void> {
  await getSupabase().from('crps').delete().eq('id', id)
}

export interface SessionAccuracy {
  sessionId: string
  date: string
  accuracy: number
  lessonTitle: string
  regulationArrival: string | null
  regulationDeparture: string | null
  crpId: string | null
  crpName: string | null
  crpColor: string | null
}

export async function getStudentAccuracyHistory(studentId: string, practitionerId: string): Promise<SessionAccuracy[]> {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)

  const { data: sessions } = await getSupabase()
    .from('sessions')
    .select('id, session_date, lesson_title, regulation_arrival, regulation_departure, crp_id')
    .eq('student_id', studentId)
    .eq('practitioner_id', practitionerId)
    .gte('session_date', cutoff.toISOString().split('T')[0])
    .order('session_date')

  if (!sessions?.length) return []

  const sessionIds = sessions.map(s => s.id)

  type RawResponse = { session_id: string; question_type: string; keyword: string | null; misspoke_count: number | null; expected_answer: string | null; captured_answer: string | null; speller_sentence: string | null }
  const responses: RawResponse[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data: page } = await getSupabase()
      .from('session_responses')
      .select('session_id, question_type, keyword, misspoke_count, expected_answer, captured_answer, speller_sentence')
      .in('session_id', sessionIds)
      .gt('hunk_number', 0)
      .order('id')
      .range(from, from + PAGE - 1)
    if (!page?.length) break
    responses.push(...(page as RawResponse[]))
    if (page.length < PAGE) break
    from += PAGE
  }

  const crpIds = [...new Set((sessions ?? []).map(s => s.crp_id).filter(Boolean))]
  const crpMap: Record<string, { name: string; color: string }> = {}
  if (crpIds.length > 0) {
    const { data: crpRows } = await getSupabase().from('crps').select('id, name, color').in('id', crpIds)
    for (const c of crpRows ?? []) crpMap[c.id] = { name: c.name, color: c.color }
  }

  const bySession: Record<string, RawResponse[]> = {}
  for (const r of responses ?? []) {
    if (!bySession[r.session_id]) bySession[r.session_id] = []
    bySession[r.session_id].push(r as RawResponse)
  }

  return sessions!.flatMap(s => {
    const rs = bySession[s.id] ?? []
    const kw = rs.filter(r => r.question_type === 'KEYWORD' && r.captured_answer !== 'SKIPPED')
    const kn = rs.filter(r => r.question_type === 'KNOWN' && r.captured_answer !== 'NOT_ASKED')
    const wp = rs.filter(r => r.question_type === 'WRITING_PROMPT' && r.captured_answer && r.captured_answer !== 'SKIPPED')
    const letters =
      kw.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
      kn.reduce((sum, q) => sum + (q.expected_answer ?? '').split('/').reduce((acc: number, a: string) => acc + a.trim().replace(/\s/g, '').length, 0), 0) +
      rs.filter(r => r.speller_sentence && r.speller_sentence.trim()).reduce((sum, r) => sum + (r.speller_sentence ?? '').replace(/\s/g, '').length, 0) +
      wp.reduce((sum, r) => sum + (r.captured_answer ?? '').replace(/\s/g, '').length, 0)
    const misspokes = rs
      .filter(r => r.captured_answer !== 'NOT_ASKED' && r.captured_answer !== 'SKIPPED')
      .reduce((sum, r) => sum + (r.misspoke_count ?? 0), 0)
    const pokes = letters + misspokes
    if (pokes === 0) return []
    const crp = s.crp_id ? crpMap[s.crp_id] : null
    return [{ sessionId: s.id, date: s.session_date, accuracy: Math.round((letters / pokes) * 100), lessonTitle: s.lesson_title, regulationArrival: s.regulation_arrival ?? null, regulationDeparture: s.regulation_departure ?? null, crpId: s.crp_id ?? null, crpName: crp?.name ?? null, crpColor: crp?.color ?? null }]
  })
}

export async function getSessionResponses(sessionId: string): Promise<SessionResponse[]> {
  const { data } = await getSupabase()
    .from('session_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('hunk_number')
  return (data ?? []).map(d => ({
    id: d.id,
    sessionId: d.session_id,
    hunkNumber: d.hunk_number < 0 ? null : d.hunk_number,
    keyword: d.keyword,
    misspokeCount: d.misspoke_count,
    questionType: d.question_type,
    questionText: d.question_text,
    expectedAnswer: d.expected_answer,
    capturedAnswer: d.captured_answer,
    spellerSentence: d.speller_sentence ?? undefined,
  }))
}

export interface StudentReportData {
  student: { name: string; ageGroup: string }
  sessions: Array<{
    id: string
    date: string
    lessonTitle: string
    notes: string
    regulationArrival: string | null
    regulationDeparture: string | null
    accuracy: number | null
    pokes: number
    isComplete: boolean
  }>
  boardMilestones: Array<{ board: string; date: string }>
  questionTypeMilestones: Array<{ type: string; date: string }>
  regulationStats: {
    arrivedDysregulated: number
    improvedByEnd: number
    ongoingConcern: number
    arrivedRegulated: number
  }
  topMisspokedLetters: Array<{ letter: string; count: number }>
  accuracyTrend: {
    first: number | null
    last: number | null
    average: number | null
    highest: number | null
    completedCount: number
  }
  financials: {
    completedSessions: number
    sessionRate: number | null
    totalBilled: number
  }
}

const REPORT_QUESTION_TYPE_LABELS: Record<string, string> = {
  KNOWN: 'KNOWN questions',
  'SEMI-OPEN': 'SEMI-OPEN questions',
  'PRIOR KNOWLEDGE': 'PRIOR KNOWLEDGE questions',
  MATH: 'MATH questions',
  OPEN: 'OPEN questions',
  VAKT: 'VAKT activities',
  WRITING_PROMPT: 'Writing prompts',
  EXTRA_SPELLING: 'Extra spelling words',
}

export async function getStudentReportData(
  studentId: string,
  practitionerId: string,
  startDate: string,
  endDate: string
): Promise<StudentReportData | null> {
  const supabase = getSupabase()

  const [{ data: studentRow }, { data: sessions }, { data: invoices }, { data: priorSessionData }] = await Promise.all([
    supabase.from('students').select('name, age_group, session_rate').eq('id', studentId).single(),
    supabase
      .from('sessions')
      .select('id, session_date, lesson_title, regulation_arrival, regulation_departure, board_level')
      .eq('student_id', studentId)
      .eq('practitioner_id', practitionerId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date'),
    supabase
      .from('invoices')
      .select('amount, extra_items')
      .eq('student_id', studentId)
      .eq('practitioner_id', practitionerId)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate),
    supabase
      .from('sessions')
      .select('id, board_level')
      .eq('student_id', studentId)
      .eq('practitioner_id', practitionerId)
      .lt('session_date', startDate),
  ])

  if (!studentRow || !sessions?.length) {
    return {
      student: { name: studentRow?.name ?? '', ageGroup: studentRow?.age_group ?? '' },
      sessions: [],
      boardMilestones: [],
      questionTypeMilestones: [],
      regulationStats: { arrivedDysregulated: 0, improvedByEnd: 0, ongoingConcern: 0, arrivedRegulated: 0 },
      topMisspokedLetters: [],
      accuracyTrend: { first: null, last: null, average: null, highest: null, completedCount: 0 },
      financials: { completedSessions: 0, sessionRate: null, totalBilled: 0 },
    }
  }

  const sessionIds = sessions.map(s => s.id)

  type RawRow = { session_id: string; question_type: string; keyword: string | null; misspoke_count: number | null; expected_answer: string | null; captured_answer: string | null; speller_sentence: string | null }
  const allRows: RawRow[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data: page } = await supabase
      .from('session_responses')
      .select('session_id, question_type, keyword, misspoke_count, expected_answer, captured_answer, speller_sentence')
      .in('session_id', sessionIds)
      .order('id')
      .range(from, from + PAGE - 1)
    if (!page?.length) break
    allRows.push(...(page as RawRow[]))
    if (page.length < PAGE) break
    from += PAGE
  }

  const bySession: Record<string, RawRow[]> = {}
  for (const r of allRows) {
    if (!bySession[r.session_id]) bySession[r.session_id] = []
    bySession[r.session_id].push(r)
  }

  type RawSession = { id: string; session_date: string; lesson_title: string; regulation_arrival: string | null; regulation_departure: string | null; board_level: string | null }
  const typedSessions = sessions as RawSession[]

  const completedIds = new Set(allRows.filter(r => r.question_type === 'SESSION_COMPLETE').map(r => r.session_id))

  // Build exclusion sets from sessions before this period
  const priorBoards = new Set<string>(
    (priorSessionData ?? []).map(s => (s as { board_level: string | null }).board_level).filter((b): b is string => b !== null)
  )
  const priorSessionIds = (priorSessionData ?? []).map(s => (s as { id: string }).id)
  const priorQTypes = new Set<string>()
  if (priorSessionIds.length > 0) {
    const { data: priorResponses } = await supabase
      .from('session_responses')
      .select('question_type')
      .in('session_id', priorSessionIds)
    for (const r of priorResponses ?? []) {
      priorQTypes.add((r as { question_type: string }).question_type)
    }
  }

  // Board milestones: only boards first reached during this period
  const seenBoards = new Set<string>()
  const boardMilestones: StudentReportData['boardMilestones'] = []
  for (const s of typedSessions) {
    if (s.board_level && !seenBoards.has(s.board_level) && !priorBoards.has(s.board_level)) {
      seenBoards.add(s.board_level)
      boardMilestones.push({ board: s.board_level, date: s.session_date })
    }
  }

  const seenQTypes = new Set<string>()
  const questionTypeMilestones: StudentReportData['questionTypeMilestones'] = []
  const letterScores: Record<string, number> = {}

  const sessionEntries: StudentReportData['sessions'] = typedSessions.map(s => {
    const rows = bySession[s.id] ?? []
    const notesRow = rows.find(r => r.question_type === 'SESSION_NOTES')
    const notes = notesRow?.captured_answer ?? ''

    for (const r of rows) {
      const label = REPORT_QUESTION_TYPE_LABELS[r.question_type]
      if (label && !seenQTypes.has(r.question_type) && !priorQTypes.has(r.question_type)) {
        if (r.question_type !== 'SESSION_NOTES' && r.question_type !== 'SESSION_STATE' && r.question_type !== 'SESSION_COMPLETE' && r.question_type !== 'SESSION_VIDEO' && r.question_type !== 'SESSION_INVOICE') {
          seenQTypes.add(r.question_type)
          questionTypeMilestones.push({ type: label, date: s.session_date })
        }
      }
    }

    // Accuracy (same formula as transcript)
    const kw = rows.filter(r => r.question_type === 'KEYWORD' && r.captured_answer !== 'SKIPPED')
    const kn = rows.filter(r => r.question_type === 'KNOWN' && r.captured_answer !== 'NOT_ASKED')
    const wp = rows.filter(r => r.question_type === 'WRITING_PROMPT' && r.captured_answer && r.captured_answer !== 'SKIPPED')
    const letters =
      kw.reduce((sum, r) => sum + (r.keyword ?? '').replace(/\s/g, '').length, 0) +
      kn.reduce((sum, r) => sum + (r.expected_answer ?? '').split('/').reduce((a: number, s2: string) => a + s2.trim().replace(/\s/g, '').length, 0), 0) +
      rows.filter(r => r.speller_sentence && r.speller_sentence.trim()).reduce((sum, r) => sum + (r.speller_sentence ?? '').replace(/\s/g, '').length, 0) +
      wp.reduce((sum, r) => sum + (r.captured_answer ?? '').replace(/\s/g, '').length, 0)
    const misspokes = rows
      .filter(r => r.captured_answer !== 'NOT_ASKED' && r.captured_answer !== 'SKIPPED')
      .reduce((sum, r) => sum + (r.misspoke_count ?? 0), 0)
    const pokes = letters + misspokes
    const accuracy = pokes > 0 ? Math.round((letters / pokes) * 100) : null

    // Letter misspoke scores — distribute each keyword's misspokes across its unique letters
    for (const r of kw) {
      if ((r.misspoke_count ?? 0) > 0 && r.keyword) {
        const uniqueLetters = [...new Set(r.keyword.replace(/\s/g, '').toUpperCase().split(''))].filter(l => /[A-Z]/.test(l))
        for (const l of uniqueLetters) {
          letterScores[l] = (letterScores[l] ?? 0) + (r.misspoke_count ?? 0)
        }
      }
    }

    return {
      id: s.id,
      date: s.session_date,
      lessonTitle: s.lesson_title,
      notes,
      regulationArrival: s.regulation_arrival ?? null,
      regulationDeparture: s.regulation_departure ?? null,
      accuracy,
      pokes,
      isComplete: completedIds.has(s.id),
    }
  })

  // Regulation stats
  const regulationStats = { arrivedDysregulated: 0, improvedByEnd: 0, ongoingConcern: 0, arrivedRegulated: 0 }
  for (const s of sessionEntries) {
    if (s.regulationArrival === 'dysregulated') {
      regulationStats.arrivedDysregulated++
      if (s.regulationDeparture === 'regulated') regulationStats.improvedByEnd++
      else if (s.regulationDeparture === 'dysregulated') regulationStats.ongoingConcern++
    } else if (s.regulationArrival === 'regulated') {
      regulationStats.arrivedRegulated++
    }
  }

  // Top 10 most misspoked letters
  const topMisspokedLetters = Object.entries(letterScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([letter, count]) => ({ letter, count }))

  // All sessions in the period that were run (complete marker OR has poke data)
  const allCompleted = sessionEntries.filter(s => s.isComplete || s.accuracy !== null)

  // Accuracy trend — only sessions that have poke/letter data
  const completedWithAccuracy = sessionEntries.filter(s => s.isComplete && s.accuracy !== null)
  const accuracies = completedWithAccuracy.map(s => s.accuracy!)
  const accuracyTrend = {
    first: accuracies[0] ?? null,
    last: accuracies[accuracies.length - 1] ?? null,
    average: accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : null,
    highest: accuracies.length ? Math.max(...accuracies) : null,
    completedCount: completedWithAccuracy.length,
  }

  // Financial summary
  const totalBilled = (invoices ?? []).reduce((sum, inv) => {
    const base = parseFloat(String(inv.amount)) || 0
    const extras = ((inv.extra_items ?? []) as Array<{ amount: number }>).reduce((s, e) => s + (e.amount || 0), 0)
    return sum + base + extras
  }, 0)
  const sessionRate = (studentRow as { session_rate?: number | null }).session_rate ?? null

  return {
    student: { name: studentRow.name, ageGroup: studentRow.age_group },
    sessions: sessionEntries,
    boardMilestones,
    questionTypeMilestones,
    regulationStats,
    topMisspokedLetters,
    accuracyTrend,
    financials: {
      completedSessions: allCompleted.length,
      sessionRate,
      totalBilled,
    },
  }
}

export interface PractitionerSettings {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  logoUrl: string
  websiteUrl: string
}

export async function getPractitionerSettings(userId: string): Promise<PractitionerSettings> {
  const { data } = await getSupabase()
    .from('practitioner_settings')
    .select('business_name, business_address, business_phone, business_email, logo_url, website_url')
    .eq('practitioner_id', userId)
    .single()
  return {
    businessName: data?.business_name ?? '',
    businessAddress: data?.business_address ?? '',
    businessPhone: data?.business_phone ?? '',
    businessEmail: data?.business_email ?? '',
    logoUrl: data?.logo_url ?? '',
    websiteUrl: data?.website_url ?? '',
  }
}

export async function updateSpellerSentence(sessionId: string, responseId: string, sentence: string): Promise<void> {
  const { error } = await getSupabase()
    .from('session_responses')
    .update({ speller_sentence: sentence || null })
    .eq('id', responseId)
    .eq('session_id', sessionId)
  if (error) throw new Error(`Update failed: ${error.message}`)
}

export async function saveProgressReport(
  practitionerId: string,
  studentId: string,
  startDate: string,
  endDate: string,
  narrative: string,
  goals: string,
  sectionsContent: Record<string, string>,
  sectionsVisible: Record<string, boolean>,
  reportData: StudentReportData,
  existingId?: string
): Promise<string> {
  const row = {
    practitioner_id: practitionerId,
    student_id: studentId,
    start_date: startDate,
    end_date: endDate,
    narrative,
    goals,
    sections_content: sectionsContent,
    sections_visible: sectionsVisible,
    report_data: reportData as unknown as Record<string, unknown>,
  }
  if (existingId) {
    const { data, error } = await getSupabase()
      .from('progress_reports')
      .update(row)
      .eq('id', existingId)
      .eq('practitioner_id', practitionerId)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return (data as { id: string } | null)?.id ?? existingId
  }
  const { data, error } = await getSupabase().from('progress_reports').insert(row).select('id').single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function getSavedReports(studentId: string, practitionerId: string): Promise<SavedReport[]> {
  const { data } = await getSupabase()
    .from('progress_reports')
    .select('*')
    .eq('student_id', studentId)
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(d => ({
    id: d.id,
    startDate: d.start_date,
    endDate: d.end_date,
    createdAt: d.created_at,
    narrative: d.narrative ?? '',
    goals: d.goals ?? '',
    sectionsContent: (d.sections_content ?? {}) as Record<string, string>,
    sectionsVisible: (d.sections_visible ?? {}) as Record<string, boolean>,
    reportData: d.report_data as StudentReportData,
  }))
}

export async function deleteProgressReport(id: string, practitionerId: string): Promise<void> {
  await getSupabase().from('progress_reports').delete().eq('id', id).eq('practitioner_id', practitionerId)
}
