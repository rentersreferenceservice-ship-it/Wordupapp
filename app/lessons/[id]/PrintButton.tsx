'use client'

export default function PrintButton() {
  function handlePrint() {
    const images = Array.from(document.images)
    const unloaded = images.filter(img => !img.complete)

    if (unloaded.length === 0) {
      window.print()
      return
    }

    Promise.all(
      unloaded.map(img => new Promise<void>(resolve => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      }))
    ).then(() => window.print())
  }

  return (
    <button
      onClick={handlePrint}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      Print
    </button>
  )
}
