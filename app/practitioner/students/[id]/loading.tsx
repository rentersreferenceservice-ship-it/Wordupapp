// Shows right away when a speller is tapped, so it's clear the tap worked
// while their page loads.
export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Opening speller…</p>
      </div>
    </main>
  )
}
