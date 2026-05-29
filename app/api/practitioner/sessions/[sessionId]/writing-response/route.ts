import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()
  const { data: session } = await supabase
    .from('sessions').select('practitioner_id').eq('id', sessionId).single()
  if (!session || session.practitioner_id !== userId)
    return Response.json({ error: 'Not found' }, { status: 404 })

  const { hunkNumber, response, promptText } = await req.json()
  if (typeof hunkNumber !== 'number') return Response.json({ error: 'hunkNumber required' }, { status: 400 })

  // Delete any existing WRITING_PROMPT for this hunk, then insert fresh
  await supabase
    .from('session_responses')
    .delete()
    .eq('session_id', sessionId)
    .eq('hunk_number', hunkNumber)
    .eq('question_type', 'WRITING_PROMPT')

  if (response?.trim()) {
    await supabase.from('session_responses').insert({
      session_id: sessionId,
      hunk_number: hunkNumber,
      question_type: 'WRITING_PROMPT',
      question_text: promptText ?? 'Writing Prompt',
      captured_answer: response.trim(),
      expected_answer: '',
      misspoke_count: 0,
    })
  }

  return Response.json({ ok: true })
}
