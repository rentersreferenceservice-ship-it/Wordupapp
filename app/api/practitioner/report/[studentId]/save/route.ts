import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveProgressReport, getSavedReports, deleteProgressReport } from '@/lib/practitionerStore'
import type { StudentReportData } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { startDate, endDate, narrative, goals, sectionsContent, sectionsVisible, reportData, existingId } = await req.json() as {
    startDate: string
    endDate: string
    narrative: string
    goals: string
    sectionsContent: Record<string, string>
    sectionsVisible: Record<string, boolean>
    reportData: StudentReportData
    existingId?: string
  }

  try {
    const id = await saveProgressReport(userId, studentId, startDate, endDate, narrative, goals, sectionsContent, sectionsVisible, reportData, existingId)
    return Response.json({ id })
  } catch (e) {
    console.error('saveProgressReport error:', e)
    return Response.json({ error: e instanceof Error ? e.message : 'Save failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const reports = await getSavedReports(studentId, userId)
  return Response.json({ reports })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await deleteProgressReport(id, userId)
  return Response.json({ ok: true })
}
