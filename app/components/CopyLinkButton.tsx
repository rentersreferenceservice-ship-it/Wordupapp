'use client'

import { useState } from 'react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — nothing more we can do here
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
    >
      {copied ? '✓ Copied' : 'Copy Link'}
    </button>
  )
}
