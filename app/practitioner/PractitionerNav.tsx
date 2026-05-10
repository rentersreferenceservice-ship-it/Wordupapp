'use client'
import { usePathname } from 'next/navigation'
import { UserButton, SignInButton, useUser } from '@clerk/nextjs'

export default function PractitionerNav() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()

  if (pathname === '/practitioner/get-started') return null

  return (
    <div className="flex justify-end items-center gap-3 px-6 py-3 border-b border-gray-100">
      {!isSignedIn && (
        <SignInButton>
          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-900 hover:bg-gray-100 transition-colors">Log In</button>
        </SignInButton>
      )}
      {isSignedIn && (
        <div className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg border-2 border-gray-900">
          <span className="text-sm font-medium">My Account</span>
          <UserButton />
        </div>
      )}
    </div>
  )
}
