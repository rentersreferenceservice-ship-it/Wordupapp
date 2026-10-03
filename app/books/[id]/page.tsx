import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import { getBook } from '@/lib/bookStore'
import BookViewer from './BookViewer'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const book = await getBook(id)
  if (!book?.coverImageUrl) return {}
  return {
    title: book.title,
    icons: { icon: book.coverImageUrl, apple: book.coverImageUrl },
  }
}

export default async function PublicBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const book = await getBook(id)

  if (!book) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <p className="text-gray-500 text-sm">This book was not found.</p>
      </main>
    )
  }

  if (book.visibility === 'private') {
    // Private — only the owning, logged-in practitioner may view it here.
    const { userId } = await auth()
    if (!userId || userId !== book.practitionerId) {
      return (
        <main className="min-h-screen bg-white flex items-center justify-center px-4">
          <p className="text-gray-500 text-sm">This book isn&apos;t available.</p>
        </main>
      )
    }
  }

  return <BookViewer book={book} />
}
