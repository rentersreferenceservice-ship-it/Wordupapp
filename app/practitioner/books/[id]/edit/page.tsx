import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBook } from '@/lib/bookStore'
import BookEditor from './BookEditor'

export const dynamic = 'force-dynamic'

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const book = await getBook(id)
  if (!book || book.practitionerId !== userId) redirect('/practitioner/books')

  return (
    <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <Link href="/practitioner/books" className="text-sm text-blue-600 hover:underline mb-4 block">← My Books</Link>
      <BookEditor book={book} />
    </main>
  )
}
