'use client'

import { forwardRef, useImperativeHandle, useRef, useState, type ChangeEvent } from 'react'

const SENTENCE_ENDERS = ['.', '!', '?']
const SPEECH_RATE = 1.4

export interface FinishedParagraph {
  text: string
  misspokeCount: number
}

export interface TypeToTalkSurfaceHandle {
  getAllParagraphs: () => FinishedParagraph[]
  reset: () => void
}

function speak(text: string) {
  const trimmed = text.trim()
  if (!trimmed || typeof window === 'undefined' || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.rate = SPEECH_RATE
  window.speechSynthesis.speak(utterance)
}

const TypeToTalkSurface = forwardRef<TypeToTalkSurfaceHandle, { placeholder?: string; rows?: number }>(
  function TypeToTalkSurface({ placeholder, rows = 10 }, ref) {
    const [text, setText] = useState('')
    const [misspokeCount, setMisspokeCount] = useState(0)
    const [finishedParagraphs, setFinishedParagraphs] = useState<FinishedParagraph[]>([])
    const paragraphStartRef = useRef(0)
    const wordStartRef = useRef(0)
    const sentenceStartRef = useRef(0)
    const speechUnlockedRef = useRef(false)

    function unlockSpeech() {
      if (speechUnlockedRef.current || typeof window === 'undefined' || !window.speechSynthesis) return
      speechUnlockedRef.current = true
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    }

    function finishParagraph(newValue: string, cursor: number) {
      const paragraph = newValue.slice(paragraphStartRef.current, cursor - 2).trim()
      paragraphStartRef.current = cursor
      wordStartRef.current = cursor
      sentenceStartRef.current = cursor
      if (paragraph) {
        speak(paragraph)
        setFinishedParagraphs(prev => [...prev, { text: paragraph, misspokeCount }])
      }
      setMisspokeCount(0)
    }

    function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
      const newValue = e.target.value
      const oldValue = text
      const cursor = e.target.selectionStart ?? newValue.length

      if (newValue.length > oldValue.length) {
        const insertedLength = newValue.length - oldValue.length
        setText(newValue)
        if (insertedLength !== 1) return // paste / autocomplete block insert — skip letter-by-letter speech
        const char = newValue[cursor - 1]

        if (/[a-zA-Z]/.test(char)) {
          speak(char)
        } else if (char === ' ') {
          // Word boundary — everything since the last word/sentence/paragraph boundary, excluding this space.
          const word = newValue.slice(wordStartRef.current, cursor - 1)
          wordStartRef.current = cursor
          speak(word)
        } else if (SENTENCE_ENDERS.includes(char)) {
          // Sentence boundary — everything since the last sentence/paragraph boundary, including this punctuation.
          const sentence = newValue.slice(sentenceStartRef.current, cursor)
          sentenceStartRef.current = cursor
          wordStartRef.current = cursor // the sentence just spoken already covered its trailing word
          speak(sentence)
        } else if (char === '\n' && newValue[cursor - 2] === '\n') {
          finishParagraph(newValue, cursor)
        }
      } else if (newValue.length < oldValue.length) {
        setMisspokeCount(m => m + (oldValue.length - newValue.length))
        setText(newValue)
      } else {
        setText(newValue)
      }
    }

    function getAllParagraphs(): FinishedParagraph[] {
      const trailing = text.slice(paragraphStartRef.current).trim()
      return trailing ? [...finishedParagraphs, { text: trailing, misspokeCount }] : finishedParagraphs
    }

    useImperativeHandle(ref, () => ({
      getAllParagraphs,
      reset() {
        setText('')
        setMisspokeCount(0)
        setFinishedParagraphs([])
        paragraphStartRef.current = 0
        wordStartRef.current = 0
        sentenceStartRef.current = 0
      },
    }))

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type to Talk</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{finishedParagraphs.length} paragraph{finishedParagraphs.length === 1 ? '' : 's'} finished</span>
            <span className={misspokeCount > 0 ? 'text-red-500 font-semibold' : ''}>{misspokeCount} misspoke{misspokeCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <textarea
          value={text}
          onChange={handleTextChange}
          onFocus={unlockSpeech}
          placeholder={placeholder ?? "Type here — letters are spoken as they're poked, words on space, sentences on a period, and paragraphs on a double Enter…"}
          rows={rows}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <p className="text-xs text-gray-400">Press Enter twice to finish a paragraph — it will be read aloud.</p>
      </div>
    )
  }
)

export default TypeToTalkSurface
