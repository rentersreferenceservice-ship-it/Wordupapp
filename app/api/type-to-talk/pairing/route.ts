import { createPublicPairing } from '@/lib/ttPairingStore'

export const dynamic = 'force-dynamic'

// Public — no login. Creates a code a family device can use to send
// lesson questions to a speller's tablet.
export async function POST() {
  const result = await createPublicPairing()
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
