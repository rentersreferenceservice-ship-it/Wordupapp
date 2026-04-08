import { NextRequest } from 'next/server'
import { getLesson, deleteLesson, saveLesson } from '@/lib/lessonStore'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })
  return Response.json(lesson)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = getLesson(id)
  if (!existing) return Response.json({ error: 'Lesson not found' }, { status: 404 })
  const updated = await req.json()
  saveLesson({ ...updated, id })
  return Response.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = deleteLesson(id)
  if (!deleted) return Response.json({ error: 'Lesson not found' }, { status: 404 })
  return Response.json({ success: true })
}
