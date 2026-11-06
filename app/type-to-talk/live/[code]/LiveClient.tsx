'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { generateQRDataUrlFromUrl } from '@/lib/qrcode'
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
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState<LiveQuestion | null>(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [connectQrDataUrl, setConnectQrDataUrl] = useState<string | null>(null)
  const [showConnectQr, setShowConnectQr] = useState(false)
  const [deviceConnectedNotice, setDeviceConnectedNotice] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)
  const questionRef = useRef<LiveQuestion | null>(null)
  const latestAnswerRef = useRef('')
  const historyRef = useRef<HistoryEntry[]>([])

  useEffect(() => {
    generateQRDataUrlFromUrl(`${window.location.origin}/type-to-talk/connect/${code}`)
      .then(setConnectQrDataUrl)
      .catch(() => {})
  }, [code])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/type-to-talk/pairing/${code}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.error) { setError('This code was not found. Ask your practitioner for a new one.'); return }
        setReady(true)
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
    if (!ready) return
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel(`tt:${code}`, { config: { broadcast: { self: false } } })
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
      .on('broadcast', { event: 'device-connected' }, () => {
        setDeviceConnectedNotice(true)
        setTimeout(() => setDeviceConnectedNotice(false), 5000)
      })
      .subscribe((status) => {
        // Previously a dropped connection (network blip, tablet going idle,
        // etc.) just left this screen frozen forever with no indication —
        // this is almost certainly what "kicked the speller off" mid-session.
        // Now it shows what's happening and retries automatically.
        if (status === 'SUBSCRIBED') {
          setConnectionLost(false)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionLost(true)
          setTimeout(() => setReconnectAttempt(n => n + 1), 2000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code, ready, reconnectAttempt])

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

  if (!ready) {
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
        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Want to keep using Type to Talk on this tablet between sessions — with a CRP, when the practitioner isn&apos;t here?</p>
          <a
            href="/type-to-talk"
            className="inline-block bg-white text-purple-700 border-2 border-purple-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
          >
            Open Type to Talk on your own
          </a>
          <p className="text-xs text-gray-400 mt-2">Tip: bookmark this page or add it to the tablet&apos;s home screen so it&apos;s always one tap away.</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        {deviceConnectedNotice && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            ✓ A new device just connected
          </div>
        )}
        <p className="text-gray-700 font-medium mb-1">Waiting for a question…</p>
        <p className="text-gray-400 text-sm mb-6">Once someone connects and sends a question, it will appear here for you to answer.</p>
        {connectQrDataUrl && (
          <div className="inline-block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Not connected to anyone yet?</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={connectQrDataUrl} alt="QR code — scan with a CRP or family member's device to connect" width={160} height={160} className="mx-auto" />
            <p className="text-xs text-gray-400 mt-3 max-w-[220px] mx-auto">
              Hand this screen to a CRP or family member and have them scan this code with their own phone or tablet&apos;s camera. Once they scan it, they can send you questions any time — you&apos;ll see a notice here each time a new device connects. The connection stays until they choose to disconnect.
            </p>
          </div>
        )}
        {connectionLost && (
          <p className="text-amber-600 text-sm mt-3">Connection lost — reconnecting…</p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {deviceConnectedNotice && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 mb-4 text-center">
          ✓ A new device just connected
        </div>
      )}
      {connectionLost && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-2 mb-4 text-center">
          Connection lost — reconnecting… your answer so far is still safe here.
        </div>
      )}
      <TypeToTalkSurface
        key={question.sequence}
        currentQuestion={question.text}
        onLiveChange={handleLiveChange}
        rows={10}
      />
      {connectQrDataUrl && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setShowConnectQr(v => !v)} className="text-xs text-gray-400 hover:text-gray-600 underline">
            {showConnectQr ? 'Hide connect code' : 'Connect another device'}
          </button>
          {showConnectQr && (
            <div className="inline-block bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={connectQrDataUrl} alt="QR code — scan to connect" width={120} height={120} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
