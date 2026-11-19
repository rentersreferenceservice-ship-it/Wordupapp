'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { generateQRDataUrlFromUrl } from '@/lib/qrcode'
import TypeToTalkSurface, { type TypeToTalkSurfaceHandle } from '@/app/components/TypeToTalkSurface'
import CopyLinkButton from '@/app/components/CopyLinkButton'

interface ChatMessage {
  id: string
  from: string // device id of the sender
  name: string
  text: string
  at: number
}

const NAME_KEY = 'tt-chat-name'
const DEVICE_KEY = 'tt-chat-device'

function speak(text: string) {
  if (!text.trim() || typeof window === 'undefined' || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text.trim())
  utterance.rate = 1.15
  window.speechSynthesis.speak(utterance)
}

function mergeMessages(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>()
  for (const m of [...a, ...b]) byId.set(m.id, m)
  return [...byId.values()].sort((x, y) => x.at - y.at)
}

export default function ConversationClient({ code }: { code: string }) {
  const storageKey = `tt-chat-${code}`
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [others, setOthers] = useState<string[]>([])
  const [typingName, setTypingName] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(true)
  const [connectionLost, setConnectionLost] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [composeKey, setComposeKey] = useState(0)
  const [saved, setSaved] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)
  const surfaceRef = useRef<TypeToTalkSurfaceHandle>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const lastTypingSentRef = useRef(0)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  // Load saved name, a per-tab device id (sessionStorage, so two tabs on one
  // computer count as two people) and any conversation already on this device.
  useEffect(() => {
    try {
      let id = sessionStorage.getItem(DEVICE_KEY)
      if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(DEVICE_KEY, id) }
      setDeviceId(id)
    } catch {
      setDeviceId(crypto.randomUUID())
    }
    try {
      const savedName = localStorage.getItem(NAME_KEY)
      if (savedName) { setName(savedName); setNameDraft(savedName) }
      const savedMessages = localStorage.getItem(storageKey)
      if (savedMessages) setMessages(JSON.parse(savedMessages))
    } catch {
      // localStorage unavailable — conversation just won't survive a reload
    }
    const url = `${window.location.origin}/type-to-talk/conversation/${code}`
    setShareUrl(url)
    generateQRDataUrlFromUrl(url, 200).then(setQrDataUrl).catch(() => {})
  }, [code, storageKey])

  useEffect(() => {
    messagesRef.current = messages
    try { localStorage.setItem(storageKey, JSON.stringify(messages)) } catch { /* ignore */ }
  }, [messages, storageKey])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  useEffect(() => {
    if (!name || !deviceId) return
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel(`chat:${code}`, {
      config: { broadcast: { self: false }, presence: { key: deviceId } },
    })
    channelRef.current = channel
    // Ignore the CLOSED status our own cleanup triggers, or it loops reconnecting forever.
    let active = true
    let retryScheduled = false

    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        const msg = payload.payload as ChatMessage
        setMessages(prev => mergeMessages(prev, [msg]))
        setTypingName(null)
        // Not read aloud automatically — the speller reads it themselves and
        // can tap 🔊 on the message if they want to hear it.
      })
      .on('broadcast', { event: 'history' }, (payload) => {
        const incoming = (payload.payload as { messages: ChatMessage[] }).messages ?? []
        setMessages(prev => mergeMessages(prev, incoming))
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        setTypingName((payload.payload as { name: string }).name)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setTypingName(null), 3000)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string }>()
        const names = Object.entries(state)
          .filter(([key]) => key !== deviceId)
          .map(([, metas]) => metas[0]?.name ?? 'Speller')
        setOthers(names)
        if (names.length > 0) setShowShare(false)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        // Someone (re)joined — share what this device has so both screens
        // show the full conversation, even if one of them reloaded.
        if (key !== deviceId && messagesRef.current.length > 0) {
          channel.send({ type: 'broadcast', event: 'history', payload: { messages: messagesRef.current } })
        }
      })
      .subscribe((status) => {
        if (!active) return
        if (status === 'SUBSCRIBED') {
          setConnectionLost(false)
          channel.track({ name })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionLost(true)
          if (retryScheduled) return
          retryScheduled = true
          setTimeout(() => { if (active) setReconnectAttempt(n => n + 1) }, 2000)
        }
      })

    return () => {
      active = false
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code, name, deviceId, reconnectAttempt])

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) return
    try { localStorage.setItem(NAME_KEY, trimmed) } catch { /* ignore */ }
    setName(trimmed)
  }

  function handleLiveChange(info: { combinedText: string }) {
    const now = Date.now()
    if (!info.combinedText || !channelRef.current || !name || now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { name } })
  }

  function handleSend() {
    if (!name || !deviceId) return
    const text = (surfaceRef.current?.getAllParagraphs() ?? []).map(p => p.text).join('\n\n').trim()
    if (!text) return
    const msg: ChatMessage = { id: crypto.randomUUID(), from: deviceId, name, text, at: Date.now() }
    setMessages(prev => mergeMessages(prev, [msg]))
    channelRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
    setComposeKey(k => k + 1) // fresh, empty box for the next message
  }

  function handleSave() {
    if (messages.length === 0) return
    const lines = messages.flatMap(m => [
      `${m.name} (${new Date(m.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}):`,
      m.text,
      '',
    ])
    const header = `Type to Talk conversation — ${new Date(messages[0].at).toLocaleDateString()}\n\n`
    const blob = new Blob([header + lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!deviceId) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-gray-400">Loading…</div>
  }

  if (!name) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Speller Conversation</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">What&apos;s your name? It shows next to everything you send.</p>
        <form onSubmit={handleJoin} className="space-y-3">
          <input
            type="text"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" disabled={!nameDraft.trim()} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
            Join the conversation
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Speller Conversation</h1>
          <p className="text-sm text-gray-500">
            {others.length > 0
              ? <span className="text-green-700">✓ Connected with {others.join(', ')}</span>
              : 'Waiting for the other speller to join…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowShare(v => !v)} className="text-sm text-purple-700 border-2 border-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-50">
            {showShare ? 'Hide invite' : 'Invite'}
          </button>
          <button type="button" onClick={handleSave} disabled={messages.length === 0} className="text-sm bg-gray-100 text-gray-700 border-2 border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            {saved ? '✓ Saved' : 'Save conversation'}
          </button>
        </div>
      </div>

      {showShare && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-4 flex-wrap">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code — scan with the other speller's tablet to join this conversation" width={140} height={140} className="shrink-0 mx-auto" />
          )}
          <div className="flex-1 min-w-[200px] space-y-2">
            <p className="text-sm font-semibold text-gray-700">Invite the other speller</p>
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Same room:</span> scan this code with their tablet&apos;s camera.
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-semibold">On Zoom:</span> copy the link and paste it in the Zoom chat. They open it in a browser window next to Zoom, so you can still see each other while you type.
            </p>
            <p className="text-xs text-gray-400">Code: <span className="font-mono font-semibold tracking-wider">{code}</span></p>
            {shareUrl && <CopyLinkButton url={shareUrl} />}
          </div>
        </div>
      )}

      {connectionLost && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-2 mb-4 text-center">
          Connection lost — reconnecting… nothing you&apos;ve written is lost.
        </div>
      )}

      <div className="space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">No messages yet — type below and tap Send to start.</p>
        )}
        {messages.map(m => {
          const mine = m.from === deviceId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <div className={`flex items-center justify-between gap-3 text-xs mb-1 ${mine ? 'text-purple-200' : 'text-gray-500'}`}>
                  <span className="font-semibold">{mine ? 'You' : m.name}</span>
                  <button type="button" onClick={() => speak(m.text)} title="Read this message aloud" className="whitespace-nowrap hover:opacity-70">🔊 Read aloud</button>
                </div>
                <p className="text-base leading-relaxed font-serif whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          )
        })}
        {typingName && <p className="text-xs text-gray-400 italic">{typingName} is typing…</p>}
        <div ref={threadEndRef} />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <TypeToTalkSurface
          key={composeKey}
          ref={surfaceRef}
          rows={5}
          placeholder="Type your question or answer here — letters, words and sentences are read aloud as you go…"
          onLiveChange={handleLiveChange}
        />
        <button
          type="button"
          onClick={handleSend}
          className="mt-3 w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
