'use client'

export default function TranscriptError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-lg w-full">
        <h1 className="text-lg font-bold text-red-600 mb-2">Transcript failed to load</h1>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto text-gray-500">{error.stack}</pre>
        <a href="/practitioner/dashboard" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Back to Dashboard</a>
      </div>
    </div>
  )
}
