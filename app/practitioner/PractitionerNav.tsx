'use client'
import { usePathname } from 'next/navigation'
import { UserButton, SignInButton, Show } from '@clerk/nextjs'

export default function PractitionerNav() {
  const pathname = usePathname()
  if (pathname === '/practitioner/pricing') return null
  return (
    <div className="flex justify-end items-center gap-3 px-6 py-3 border-b border-gray-100">
      <Show when="signed-out">
        <SignInButton>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Log In</button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  )
}
