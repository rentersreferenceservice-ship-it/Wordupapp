import { getSupabase } from './supabase'
import type { Lesson } from './types'

export async function saveLesson(lesson: Lesson): Promise<void> {
  await getSupabase().from('lessons').upsert({
    id: lesson.id,
    topic: lesson.topic,
    age_group: lesson.ageGroup,
    title: lesson.title,
    created_at: lesson.createdAt,
    hunks: lesson.hunks,
    citations: lesson.citations,
    hashtags: lesson.hashtags ?? [],
    practitioner_id: lesson.practitionerId ?? null,
    is_ai_generated: lesson.isAiGenerated ?? true,
    author: lesson.author ?? null,
  })
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const { data } = await getSupabase().from('lessons').select('*').eq('id', id).single()
  if (!data) return null
  return dbRowToLesson(data)
}

export async function listLessons(): Promise<Lesson[]> {
  const { data } = await getSupabase().from('lessons').select('*').is('practitioner_id', null).order('created_at', { ascending: false })
  if (!data) return []
  return data.map(dbRowToLesson)
}

export async function listPractitionerLessons(practitionerId: string): Promise<Lesson[]> {
  const { data } = await getSupabase().from('lessons').select('*').eq('practitioner_id', practitionerId).order('created_at', { ascending: false })
  if (!data) return []
  return data.map(dbRowToLesson)
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('lessons').delete().eq('id', id)
  return !error
}

function dbRowToLesson(row: Record<string, unknown>): Lesson {
  return {
    id: row.id as string,
    topic: row.topic as string,
    ageGroup: row.age_group as string,
    title: row.title as string,
    createdAt: row.created_at as string,
    hunks: row.hunks as Lesson['hunks'],
    citations: row.citations as string[],
    hashtags: row.hashtags as string[],
    practitionerId: row.practitioner_id as string | undefined,
    isAiGenerated: row.is_ai_generated !== false,
    author: row.author as string | undefined,
  }
}
