'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import TypeToTalkSurface from '@/app/components/TypeToTalkSurface'

interface LiveQuestion {
  text: string
  sequence: number
}

export default function LiveClient({ code }: { code: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState<LiveQuestion | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/type-to-talk/pairing/${code}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (!data.sessionId) { setError('This code was not found. Ask your practitioner for a new one.'); return }
        setSessionId(data.sessionId)
      })
      .catch(() => { if (!cancelled) setError('Something went wrong connecting. Please try again.') })
    return () => { cancelled = true }
  }, [code])

  useEffect(() => {
    if (!sessionId) return
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel(`tt:${sessionId}`, { config: { broadcast: { self: false } } })
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'question' }, (payload) => {
        const data = payload.payload as { sequence: number; questionText: string }
        setQuestion({ text: data.questionText, sequence: data.sequence })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [sessionId])

  function handleLiveChange(info: { combinedText: string; totalMisspokeCount: number }) {
    if (!question || !channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'answer',
      payload: { sequence: question.sequence, combinedText: info.combinedText, totalMisspokeCount: info.totalMisspokeCount },
    })
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Connecting…</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Waiting for a question…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <TypeToTalkSurface
        key={question.sequence}
        currentQuestion={question.text}
        onLiveChange={handleLiveChange}
        rows={10}
      />
    </div>
  )
}
