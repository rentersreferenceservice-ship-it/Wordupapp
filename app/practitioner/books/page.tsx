import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBooks } from '@/lib/bookStore'

export const dynamic = 'force-dynamic'

export default async function BooksLibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const books = await getBooks(userId)

  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline mb-1 block">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/practitioner/books/generate" className="bg-white text-blue-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
            ✨ Generate with AI
          </Link>
          <Link href="/practitioner/books/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + New Book
          </Link>
        </div>
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No books yet. Create your first one to get started.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {books.map(b => (
            <Link key={b.id} href={`/practitioner/books/${b.id}/edit`} className="group">
              <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mb-2 flex items-center justify-center">
                {b.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.coverImageUrl} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-300 text-xs">No cover</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">{b.title}</p>
              <p className="text-xs text-gray-400">
                {b.pages.length} page{b.pages.length === 1 ? '' : 's'} · {b.visibility === 'link' ? 'Shared by link' : b.visibility === 'public' ? 'Public' : 'Private'}
              </p>
              {b.ageGroup && <p className="text-xs text-blue-500 mt-0.5">{b.ageGroup}</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
