import { NextRequest } from 'next/server'
import { generateLesson } from '@/lib/generateLesson'
import { saveLesson } from '@/lib/lessonStore'

export async function POST(request: NextRequest) {
  try {
    const { topic, ageGroup } = await request.json()

    if (!topic || !ageGroup) {
      return Response.json({ error: 'Topic and age group are required' }, { status: 400 })
    }

    const lesson = await generateLesson(topic, ageGroup)
    saveLesson(lesson)

    return Response.json(lesson)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Generate error:', e)
    return Response.json({ error: message }, { status: 500 })
  }
}
