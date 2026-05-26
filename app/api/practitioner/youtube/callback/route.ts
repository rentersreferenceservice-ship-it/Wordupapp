import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/practitioner/dashboard?yt=error`)
  }

  const redirectUri = `${appUrl}/api/practitioner/youtube/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/practitioner/dashboard?yt=error`)
  }

  const tokens = await tokenRes.json()

  await getSupabase().from('practitioner_youtube_tokens').upsert({
    practitioner_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
  })

  return NextResponse.redirect(`${appUrl}/practitioner/dashboard?yt=connected`)
}
