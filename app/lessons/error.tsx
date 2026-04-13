'use client'

export default function LessonsError({ error }: { error: Error }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Error loading library</h2>
        <p className="text-sm text-gray-700 font-mono bg-gray-100 p-3 rounded-lg text-left break-all">{error.message}</p>
      </div>
    </main>
  )
}
