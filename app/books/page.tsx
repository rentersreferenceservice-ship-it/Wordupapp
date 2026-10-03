import Link from 'next/link'
import { getPublicBooks } from '@/lib/bookStore'

export const dynamic = 'force-dynamic'

export default async function PublicBookLibraryPage() {
  const books = await getPublicBooks()

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Library</h1>
        <p className="text-sm text-gray-500 mb-8">Simple visual storybooks — tap a cover to start reading.</p>

        {books.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No books here yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {books.map(b => (
              <Link key={b.id} href={`/books/${b.id}`} className="group">
                <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mb-2 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  {b.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverImageUrl} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-300 text-xs">No cover</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">{b.title}</p>
                {b.author && <p className="text-xs text-gray-400">by {b.author}</p>}
                {b.ageGroup && <p className="text-xs text-blue-500">{b.ageGroup}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
