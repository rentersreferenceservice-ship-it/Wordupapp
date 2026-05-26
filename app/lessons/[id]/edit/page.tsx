import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getLesson } from '@/lib/lessonStore'
import EditLessonClient from './EditLessonClient'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export const dynamic = 'force-dynamic'

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) redirect(`/lessons/${id}`)

  const lesson = await getLesson(id)
  if (!lesson) notFound()

  return <EditLessonClient lesson={lesson} />
}
