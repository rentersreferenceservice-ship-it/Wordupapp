import { listLessons } from '@/lib/lessonStore'

export async function GET() {
  const lessons = listLessons()
  return Response.json(lessons)
}
