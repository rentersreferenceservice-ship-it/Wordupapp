import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import PublicNav from '../components/PublicNav'
import PublicFooter from '../components/PublicFooter'
import { getLesson } from '@/lib/lessonStore'
import { generateQRDataUrlFromUrl } from '@/lib/qrcode'
import TypeToTalkSurface from '../components/TypeToTalkSurface'
import CopyLinkButton from '../components/CopyLinkButton'

export const dynamic = 'force-dynamic'

const PAGE_DESCRIPTION = "A free real-time spelling and communication practice tool for every speller — no account or subscription required. Type on any keyboard, on-screen or Bluetooth, and hear it read back letter by letter, word by word, sentence by sentence, and paragraph by paragraph."

export const metadata: Metadata = {
  title: 'Type to Talk — Free Spelling & Communication Tool | Word Up',
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: 'Type to Talk — Free for Every Speller',
    description: PAGE_DESCRIPTION,
    type: 'website',
  },
}

async function getBaseUrl() {
  const h = await headers()
  const host = h.get('host') ?? 'wordups2c.com'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export default async function TypeToTalkPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const { lesson: lessonId } = await searchParams
  const lesson = lessonId ? await getLesson(lessonId).catch(() => null) : null

  const baseUrl = await getBaseUrl()
  const shareUrl = lesson ? `${baseUrl}/type-to-talk?lesson=${lesson.id}` : `${baseUrl}/type-to-talk`
  const qrDataUrl = await generateQRDataUrlFromUrl(shareUrl).catch(() => null)

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Type to Talk</h1>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mt-1">Free for all spellers — no account needed</p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Type to Talk is a real-time spelling and communication practice tool. Type on any keyboard — the on-screen keyboard on a tablet
              or a phone works, and so does a Bluetooth keyboard — and hear it read back as you go: each letter is spoken as it&apos;s poked,
              the whole word once you hit space, the whole sentence on a period, and the whole paragraph after pressing Enter twice.
            </p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Anyone can use it, at any time, for free — no sign-up, no login, and no subscription. Nothing you type here is saved.
            </p>
          </div>

          {lesson && (
            <div className="bg-white border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Using with lesson</p>
                <p className="text-sm font-semibold text-blue-900">{lesson.title}</p>
              </div>
              <Link href={`/lessons/${lesson.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline whitespace-nowrap">
                View lesson
              </Link>
            </div>
          )}

          {/* Share */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 flex-wrap">
            {qrDataUrl && (
              <a href={shareUrl} className="shrink-0" title="Open Type to Talk">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR code linking to this Type to Talk page — tap to open, or scan with a camera" width={100} height={100} className="rounded-lg border border-gray-100 hover:border-purple-400 transition-colors" />
              </a>
            )}
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold text-gray-700">Share this tool</p>
              <p className="text-xs text-gray-400 mt-0.5">Tap or scan the code to open it directly on another device, copy the link, or save the QR image to share on Facebook or anywhere else.</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyLinkButton url={shareUrl} />
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download="type-to-talk-qr.png"
                  className="bg-gray-100 text-gray-700 border-2 border-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Save QR Code
                </a>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <TypeToTalkSurface rows={14} />
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
