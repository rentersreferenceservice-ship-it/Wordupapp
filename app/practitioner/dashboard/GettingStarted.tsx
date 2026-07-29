const STEPS = [
  {
    n: 1,
    title: 'Add your first student',
    body: 'Go to the My Students section below and click "+ Add Student." Enter their name, age group, and any relevant notes.',
  },
  {
    n: 2,
    title: 'Choose or generate a lesson',
    body: 'Use the Lesson Generator to create a new lesson on any topic, or browse the Lesson Library for an existing one.',
  },
  {
    n: 3,
    title: 'Start a session',
    body: 'Open your student\'s profile and tap "Start Session." Select the lesson and work through it with your student in real time.',
  },
  {
    n: 4,
    title: 'Review the transcript',
    body: 'After the session, view accuracy scores, mark skipped questions, and add any extra spelling words. Everything saves automatically.',
  },
  {
    n: 5,
    title: 'Send an invoice',
    body: 'From the transcript page, tap "Generate Invoice." Fill in the funder details and email it directly — or print a PDF copy.',
  },
]

export default function GettingStarted() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <h2 className="text-base font-bold text-blue-900 mb-1">Welcome — here&apos;s how to get started</h2>
      <p className="text-xs text-blue-700 mb-4">This guide will disappear once you add your first student.</p>
      <ol className="space-y-4">
        {STEPS.map(s => (
          <li key={s.n} className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-blue-900">{s.title}</p>
              <p className="text-xs text-blue-700 mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
