'use client'

import { useState } from 'react'

export default function WritingPromptTabs({
  writingPrompts,
  legacyPrompt,
}: {
  writingPrompts?: { beginner: string; intermediate: string; pro: string }
  legacyPrompt?: string
}) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'pro'>('intermediate')
  const text = writingPrompts?.[level] ?? legacyPrompt ?? ''

  return (
    <div className="mt-3 border border-pink-200 rounded-lg p-3 bg-pink-50">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide">Writing Prompt</p>
        {writingPrompts && (
          <div className="flex rounded-lg border border-pink-200 overflow-hidden text-[10px] print:hidden">
            {(['beginner', 'intermediate', 'pro'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-1.5 py-0.5 capitalize transition-colors ${level === l ? 'bg-pink-500 text-white' : 'bg-white text-pink-500 hover:bg-pink-50'}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-pink-600">{text}</p>
    </div>
  )
}
