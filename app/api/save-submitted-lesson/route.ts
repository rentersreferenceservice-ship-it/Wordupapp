import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveLesson } from '@/lib/lessonStore'
import { v4 as uuidv4 } from 'uuid'
import type { Lesson } from '@/lib/types'

export async function POST(request: Request) {
  const { userId } = await auth()
  const body = await request.json()
  const { title, topic, ageGroup, hunks, citations, scope, author } = body

  const lesson: Lesson = {
    id: uuidv4(),
    topic: topic || 'Submitted',
    ageGroup: ageGroup || 'General',
    title: title || 'Untitled Lesson',
    createdAt: new Date().toISOString(),
    hunks,
    citations: citations || [],
    hashtags: [],
    practitionerId: scope === 'private' && userId ? userId : undefined,
    isAiGenerated: false,
    author: author || undefined,
  }

  await saveLesson(lesson)
  return NextResponse.json({ id: lesson.id })
}
