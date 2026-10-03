import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBooks, createBook } from '@/lib/bookStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const books = await getBooks(userId)
  return Response.json({ books })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  if (!body.title?.trim()) return Response.json({ error: 'A title is required' }, { status: 400 })

  const book = await createBook(userId, {
    title: body.title,
    subtitle: body.subtitle,
    author: body.author,
    coverImageUrl: body.coverImageUrl,
    ageGroup: body.ageGroup,
  })
  return Response.json({ book })
}
