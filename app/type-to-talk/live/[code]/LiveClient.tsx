'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import TypeToTalkSurface from '@/app/components/TypeToTalkSurface'

interface LiveQuestion {
  text: string
  sequence: number
}

interface HistoryEntry {
  question: string
  answer: string
}

export default function LiveClient({ code }: { code: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState<LiveQuestion | null>(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)
  const questionRef = useRef<LiveQuestion | null>(null)
  const latestAnswerRef = useRef('')
  const historyRef = useRef<HistoryEntry[]>([])

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

  function finishCurrentQuestion() {
    const current = questionRef.current
    if (current && latestAnswerRef.current.trim()) {
      historyRef.current = [...historyRef.current, { question: current.text, answer: latestAnswerRef.current }]
    }
    latestAnswerRef.current = ''
  }

  useEffect(() => {
    if (!sessionId) return
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel(`tt:${sessionId}`, { config: { broadcast: { self: false } } })
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'question' }, (payload) => {
        const data = payload.payload as { sequence: number; questionText: string }
        finishCurrentQuestion()
        const next = { text: data.questionText, sequence: data.sequence }
        questionRef.current = next
        setQuestion(next)
      })
      .on('broadcast', { event: 'session-end' }, () => {
        finishCurrentQuestion()
        setSessionEnded(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [sessionId])

  function handleLiveChange(info: { combinedText: string; totalMisspokeCount: number }) {
    latestAnswerRef.current = info.combinedText
    if (!question || !channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'answer',
      payload: { sequence: question.sequence, combinedText: info.combinedText, totalMisspokeCount: info.totalMisspokeCount },
    })
  }

  function handleDownload() {
    const lines = historyRef.current.flatMap(h => [`Question: ${h.question}`, `Answer: ${h.answer}`, ''])
    const text = lines.length ? lines.join('\n') : 'No answers were recorded this session.'
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  if (sessionEnded) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-semibold text-gray-800">Session complete!</p>
        <p className="text-sm text-gray-500">You can save a copy of what you wrote to this device.</p>
        <button
          onClick={handleDownload}
          className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Save to my device
        </button>
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
