import { getSupabase } from './supabase'

export type BookVisibility = 'private' | 'link' | 'public'

export interface BookPage {
  imageUrl: string
  caption: string
}

export interface Book {
  id: string
  practitionerId: string
  title: string
  subtitle: string
  author: string
  coverImageUrl: string | null
  ageGroup: string
  pages: BookPage[]
  visibility: BookVisibility
  createdAt: string
  updatedAt: string
}

function mapRow(d: Record<string, unknown>): Book {
  return {
    id: d.id as string,
    practitionerId: d.practitioner_id as string,
    title: d.title as string,
    subtitle: (d.subtitle as string | null) ?? '',
    author: (d.author as string | null) ?? '',
    coverImageUrl: (d.cover_image_url as string | null) ?? null,
    ageGroup: (d.age_group as string | null) ?? '',
    pages: (d.pages as BookPage[] | null) ?? [],
    visibility: d.visibility as BookVisibility,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

export async function getBooks(practitionerId: string): Promise<Book[]> {
  const { data } = await getSupabase()
    .from('books')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('updated_at', { ascending: false })
  return (data ?? []).map(mapRow)
}

export async function getPublicBooks(): Promise<Book[]> {
  const { data } = await getSupabase()
    .from('books')
    .select('*')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
  return (data ?? []).map(mapRow)
}

export async function getBook(id: string): Promise<Book | null> {
  const { data } = await getSupabase().from('books').select('*').eq('id', id).single()
  if (!data) return null
  return mapRow(data)
}

export async function createBook(
  practitionerId: string,
  fields: { title: string; subtitle?: string; author?: string; coverImageUrl?: string | null; ageGroup?: string }
): Promise<Book> {
  const { data, error } = await getSupabase()
    .from('books')
    .insert({
      practitioner_id: practitionerId,
      title: fields.title,
      subtitle: fields.subtitle ?? null,
      author: fields.author ?? null,
      cover_image_url: fields.coverImageUrl ?? null,
      age_group: fields.ageGroup ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create book')
  return mapRow(data)
}

export async function updateBook(
  id: string,
  practitionerId: string,
  fields: Partial<{ title: string; subtitle: string; author: string; coverImageUrl: string | null; ageGroup: string; visibility: BookVisibility }>
): Promise<{ ok: true } | { error: string }> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.title !== undefined) update.title = fields.title
  if (fields.subtitle !== undefined) update.subtitle = fields.subtitle
  if (fields.author !== undefined) update.author = fields.author
  if (fields.coverImageUrl !== undefined) update.cover_image_url = fields.coverImageUrl
  if (fields.ageGroup !== undefined) update.age_group = fields.ageGroup
  if (fields.visibility !== undefined) update.visibility = fields.visibility

  const { error } = await getSupabase()
    .from('books')
    .update(update)
    .eq('id', id)
    .eq('practitioner_id', practitionerId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function updatePages(
  id: string,
  practitionerId: string,
  pages: BookPage[]
): Promise<{ ok: true } | { error: string }> {
  const { error } = await getSupabase()
    .from('books')
    .update({ pages, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('practitioner_id', practitionerId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function deleteBook(id: string, practitionerId: string): Promise<{ ok: true } | { error: string }> {
  const { error } = await getSupabase()
    .from('books')
    .delete()
    .eq('id', id)
    .eq('practitioner_id', practitionerId)
  if (error) return { error: error.message }
  return { ok: true }
}
