'use client'
import { usePathname } from 'next/navigation'
import { UserButton, useUser, useClerk } from '@clerk/nextjs'

export default function RootNav() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()
  const { openSignIn, openSignUp } = useClerk()

  if (pathname.startsWith('/practitioner')) return null
  if (pathname.startsWith('/join')) return null

  return (
    <div className="relative z-20 flex justify-end items-center gap-3 px-6 py-3 print:hidden">
      {!isSignedIn && (
        <>
          <button
            onClick={() => openSignIn()}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-900 hover:bg-gray-100 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => openSignUp()}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-900 hover:bg-gray-100 transition-colors"
          >
            Create Account
          </button>
        </>
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
