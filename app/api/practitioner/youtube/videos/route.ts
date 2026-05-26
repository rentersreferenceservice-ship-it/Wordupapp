import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getValidAccessToken(practitionerId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('practitioner_youtube_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('practitioner_id', practitionerId)
    .single()

  if (!data) return null

  if (data.expires_at && data.expires_at < Date.now() + 60_000) {
    if (!data.refresh_token) return null
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    if (!refreshRes.ok) return null
    const newTokens = await refreshRes.json()
    await getSupabase().from('practitioner_youtube_tokens').update({
      access_token: newTokens.access_token,
      expires_at: Date.now() + newTokens.expires_in * 1000,
    }).eq('practitioner_id', practitionerId)
    return newTokens.access_token
  }

  return data.access_token
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return Response.json({ error: 'YouTube not connected', notConnected: true }, { status: 200 })

  // Get the uploads playlist ID from the user's channel
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!channelRes.ok) return Response.json({ error: 'Failed to fetch channel' }, { status: 502 })
  const channelData = await channelRes.json()
  const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsId) return Response.json({ videos: [] })

  // Fetch up to 50 videos from uploads playlist (includes unlisted)
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!playlistRes.ok) return Response.json({ error: 'Failed to fetch videos' }, { status: 502 })
  const playlistData = await playlistRes.json()

  const videos = (playlistData.items ?? []).map((item: {
    snippet: {
      resourceId: { videoId: string }
      title: string
      thumbnails?: { default?: { url: string } }
      publishedAt: string
    }
  }) => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.default?.url ?? '',
    publishedAt: item.snippet.publishedAt,
  }))

  return Response.json({ videos })
}
