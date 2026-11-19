'use client'

import { useRouter } from 'next/navigation'

// No look-alike characters (0/O, 1/I/L) so the code is easy to read aloud or type.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, b => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

export default function StartConversationButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.push(`/type-to-talk/conversation/${newCode()}`)}
      className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
    >
      Start a new conversation
    </button>
  )
}
