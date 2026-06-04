export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-screen bg-white">
      {children}
    </div>
  )
}
