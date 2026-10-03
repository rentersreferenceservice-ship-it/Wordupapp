import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBook, updateBook, deleteBook } from '@/lib/bookStore'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const book = await getBook(id)
  if (!book || book.practitionerId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ book })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const result = await updateBook(id, userId, {
    title: body.title,
    subtitle: body.subtitle,
    author: body.author,
    coverImageUrl: body.coverImageUrl,
    ageGroup: body.ageGroup,
    visibility: body.visibility,
  })
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const result = await deleteBook(id, userId)
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
