import type { Metadata } from 'next'
import PublicNav from '../../components/PublicNav'
import PublicFooter from '../../components/PublicFooter'
import StartConversationButton from './StartConversationButton'

export const metadata: Metadata = {
  title: 'Tablet to Tablet — Type to Talk | Word Up',
  description: 'Two spellers, two tablets — ask and answer each other back and forth, with every letter, word and sentence read aloud.',
}

export default function ConversationStartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 px-4 py-10">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Tablet to Tablet</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Two spellers, each on their own tablet, take turns asking and answering each other — the whole conversation
            stays on both screens like a text thread, and every letter, word and sentence is read aloud as it&apos;s typed.
          </p>
          <ol className="text-sm text-gray-600 text-left space-y-1 list-decimal list-inside bg-purple-50 rounded-xl px-4 py-3">
            <li>Tap the button below on one tablet.</li>
            <li>Scan the QR code it shows with the other tablet — or copy the link and send it (for example in the Zoom chat).</li>
            <li>Start typing. Tap Send and it appears on both screens.</li>
          </ol>
          <StartConversationButton />
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
