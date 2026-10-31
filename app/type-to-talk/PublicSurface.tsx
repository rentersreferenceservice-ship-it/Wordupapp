'use client'

import { useRef, useState } from 'react'
import TypeToTalkSurface, { type TypeToTalkSurfaceHandle } from '../components/TypeToTalkSurface'

interface HistoryEntry {
  question: string
  answer: string
}

export default function PublicSurface({ rows }: { rows?: number }) {
  const surfaceRef = useRef<TypeToTalkSurfaceHandle>(null)
  const [question, setQuestion] = useState('')
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
  const [surfaceKey, setSurfaceKey] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [saved, setSaved] = useState(false)

  function currentAnswerText(): string {
    const paragraphs = surfaceRef.current?.getAllParagraphs() ?? []
    return paragraphs.map(p => p.text).join('\n\n')
  }

  function askQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setActiveQuestion(question.trim())
    setQuestion('')
    setSurfaceKey(k => k + 1)
  }

  function askAnother() {
    if (activeQuestion) {
      setHistory(prev => [...prev, { question: activeQuestion, answer: currentAnswerText() }])
    }
    setActiveQuestion(null)
    setSurfaceKey(k => k + 1)
  }

  function handleSave() {
    const full = [...history]
    if (activeQuestion) full.push({ question: activeQuestion, answer: currentAnswerText() })
    if (full.length === 0) return
    const text = full.flatMap(h => [`Question: ${h.question}`, `Answer: ${h.answer}`, '']).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `type-to-talk-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!activeQuestion) {
    return (
      <div className="space-y-4">
        <form onSubmit={askQuestion} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Ask a question</label>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="What would you like for dinner?"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Ask
          </button>
        </form>

        {history.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {history.length} question{history.length === 1 ? '' : 's'} so far
            </p>
            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              {saved ? '✓ Saved to your device' : 'Save Conversation'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <TypeToTalkSurface key={surfaceKey} ref={surfaceRef} rows={rows} currentQuestion={activeQuestion} />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={askAnother}
          className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Ask Another Question
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Conversation'}
        </button>
      </div>
    </div>
  )
}
