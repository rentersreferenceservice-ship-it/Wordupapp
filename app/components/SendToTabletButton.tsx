'use client'

import { useState } from 'react'
import { useTabletConnection } from './TabletConnectionProvider'

export default function SendToTabletButton({ questionText }: { questionText: string }) {
  const { code, sendQuestion } = useTabletConnection()
  const [justSent, setJustSent] = useState(false)

  if (!code) return null

  function handleClick() {
    sendQuestion(questionText)
    setJustSent(true)
    setTimeout(() => setJustSent(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Send this question to the connected tablet"
      className="print:hidden shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
    >
      {justSent ? '✓ Sent' : '📲 Send'}
    </button>
  )
}
