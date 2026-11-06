'use client'

import { useState } from 'react'
import { useTabletConnection } from '@/app/components/TabletConnectionProvider'

const QUICK_QUESTIONS = [
  'What would you like for dinner?',
  'How are you feeling right now?',
  'What do you want to do today?',
  'Do you need anything?',
  'What was the best part of your day?',
]

export default function AskFreestyleClient() {
  const { code, sendQuestion } = useTabletConnection()
  const [question, setQuestion] = useState('')
  const [sent, setSent] = useState<string | null>(null)

  function send(text: string) {
    if (!text.trim() || !code) return
    sendQuestion(text.trim())
    setSent(text.trim())
    setQuestion('')
    setTimeout(() => setSent(null), 2500)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Ask a Question</h1>
      <p className="text-sm text-gray-500 mb-6">
        Type a question and send it — it shows up right away on their Type to Talk screen for them to answer.
      </p>

      <form onSubmit={e => { e.preventDefault(); send(question) }} className="space-y-3 mb-6">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="What would you like for dinner?"
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        <button
          type="submit"
          disabled={!code || !question.trim()}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Or pick a quick question</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={!code}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {sent && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 text-center">
          ✓ Sent: &quot;{sent}&quot;
        </div>
      )}
    </div>
  )
}
