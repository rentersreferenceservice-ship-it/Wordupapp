import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { updatePages } from '@/lib/bookStore'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const pages = Array.isArray(body.pages) ? body.pages : []
  const result = await updatePages(id, userId, pages)
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
