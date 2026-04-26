import PractitionerNav from './PractitionerNav'

export default function PractitionerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-screen bg-white">
      <PractitionerNav />
      {children}
    </div>
  )
}
