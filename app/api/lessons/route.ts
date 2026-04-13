import { listLessons } from '@/lib/lessonStore'

export async function GET() {
  const lessons = await listLessons()
  return Response.json(lessons)
}
