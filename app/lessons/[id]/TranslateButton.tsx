'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Lesson } from '@/lib/types'

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Dutch', 'Polish', 'Russian', 'Turkish', 'Arabic',
  'Hindi', 'Mandarin', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Vietnamese',
]

const QUESTION_COLORS: Record<string, string> = {
  'KNOWN': 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  'MATH': 'text-purple-700',
  'VAKT': 'text-red-500',
  'OPEN': 'text-pink-500',
}

export default function TranslateButton({ lessonId }: { lessonId: string }) {
  const [showPicker, setShowPicker] = useState(false)
  const [language, setLanguage] = useState('Spanish')
  const [loading, setLoading] = useState(false)
  const [translatedLesson, setTranslatedLesson] = useState<Lesson | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleTranslate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lessons/${lessonId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Translation failed')
      setTranslatedLesson(data.lesson)
      setSelectedLanguage(language)
      setShowPicker(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Translation failed')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    document.body.classList.add('printing-translation')
    window.print()
    setTimeout(() => document.body.classList.remove('printing-translation'), 1000)
  }

  if (!mounted) return null

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors print:hidden"
      >
        Translate
      </button>

      {/* Language picker */}
      {showPicker && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Translate Lesson</h2>
            <p className="text-sm text-gray-500">The English original is preserved. The translation opens in a print-ready view.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleTranslate}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? `Translating to ${language}…` : `Translate to ${language}`}
            </button>
            <button
              onClick={() => { setShowPicker(false); setError('') }}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Translated lesson overlay */}
      {translatedLesson && createPortal(
        <>
          <style>{`
            @media print {
              body.printing-translation > *:not(#translation-overlay) { display: none !important; }
              #translation-overlay { position: static !important; height: auto !important; overflow: visible !important; }
            }
          `}</style>
          <div id="translation-overlay" className="fixed inset-0 z-[9998] bg-white overflow-y-auto">

            {/* Top bar */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between print:hidden">
              <span className="text-sm font-semibold text-gray-600">{selectedLanguage} Translation</span>
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setTranslatedLesson(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Back to English
                </button>
              </div>
            </div>

            {/* Lesson content */}
            <div className="max-w-4xl mx-auto px-8 py-8 font-[Arial,sans-serif] text-[14pt] leading-snug">
              <div className="flex justify-center mb-1">
                <img src="/word_up_clean.jpeg" alt="Word Up" className="h-20 object-contain" />
              </div>
              <p className="text-center text-[10pt] text-gray-500">worduplessongenerator.com</p>
              <p className="text-center text-[10pt] text-gray-500">wordups2c@gmail.com</p>
              <p className="text-center text-[10pt] text-gray-500 mb-3">
                {translatedLesson.isAiGenerated === false ? 'S2C Lesson' : 'AI Generated S2C Lesson'}
              </p>
              <h1 className="text-2xl font-bold text-center mb-1">{translatedLesson.title}</h1>
              {translatedLesson.author && (
                <p className="text-center text-[9pt] text-gray-500 mb-1">By {translatedLesson.author}</p>
              )}
              {translatedLesson.hashtags?.length > 0 && (
                <p className="text-center text-sm text-blue-500 mb-8">{translatedLesson.hashtags.join(' ')}</p>
              )}

              {translatedLesson.hunks.map(hunk => (
                <section key={hunk.number} className="mb-8">
                  {hunk.imageUrl && (
                    <img
                      src={hunk.imageUrl}
                      alt={hunk.imageAlt || ''}
                      className="w-full max-h-48 object-contain rounded-xl mb-3 bg-gray-50"
                    />
                  )}
                  <p className="mb-3 text-gray-900 leading-relaxed">{hunk.text}</p>
                  <div className="space-y-2 pl-2">
                    {hunk.questions.map((q, qi) => (
                      <div key={qi}>
                        <span className={`font-medium ${QUESTION_COLORS[q.type] ?? ''}`}>{q.question}</span>
                        {q.answer && (
                          <div className="ml-4 text-black font-normal">{q.answer}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {hunk.writingPrompt && (
                    <div className="mt-3 border border-pink-200 rounded-lg p-3 bg-pink-50">
                      <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Writing Prompt</p>
                      <p className="text-sm text-pink-600">{hunk.writingPrompt}</p>
                    </div>
                  )}
                </section>
              ))}

              <section className="mt-10 pt-6 border-t border-gray-200">
                <h2 className="font-bold text-sm mb-2">References</h2>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  {translatedLesson.citations.map((c, i) => <li key={i}>{c}</li>)}
                </ol>
              </section>

              <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
                <span className="font-medium text-green-700">KNOWN</span> |{' '}
                <span className="font-medium text-orange-500">SEMI-OPEN</span> |{' '}
                <span className="font-medium text-purple-700">MATH</span> |{' '}
                <span className="font-medium text-blue-600">PRIOR KNOWLEDGE</span> |{' '}
                <span className="font-medium text-pink-600">OPEN</span> |{' '}
                <span className="font-medium text-red-600">VAKT</span>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
