'use client'
import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs'

export default function RootNav() {
  const pathname = usePathname()
  if (pathname.startsWith('/practitioner')) return null
  return (
    <div className="relative z-20 flex justify-end items-center gap-3 px-6 py-3 print:hidden">
      {/* Practitioner Login — hidden until ready to launch */}
      {/* <a href="/practitioner/dashboard" className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-900 hover:bg-gray-100 transition-colors">Practitioner Login</a> */}
      <Show when="signed-out">
        <SignInButton>
          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-900 hover:bg-gray-100 transition-colors">Log In</button>
        </SignInButton>
      </Show>
      <Show when="signed-out">
        <SignUpButton>
          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-900 hover:bg-gray-100 transition-colors">Create Account</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg border-2 border-gray-900">
          <span className="text-sm font-medium">My Account</span>
          <UserButton />
        </div>
      </Show>
    </div>
  )
}
