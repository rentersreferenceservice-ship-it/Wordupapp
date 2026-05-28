import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your free month has started!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to Word Up. Generate as many lessons as you need for the next 30 days — no charge until your trial ends. Cancel anytime before then and you won&apos;t be billed.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors inline-block"
        >
          Start Generating Lessons
        </Link>
      </div>
    </main>
  )
}
