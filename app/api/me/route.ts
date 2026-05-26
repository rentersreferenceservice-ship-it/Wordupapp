import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  return Response.json({ userId })
}
