export default function PractitionerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-white z-10 overflow-y-auto">
      {children}
    </div>
  )
}
