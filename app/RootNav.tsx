'use client'
import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs'
import SubscribeButton from './SubscribeButton'

export default function RootNav() {
  const pathname = usePathname()
  if (pathname.startsWith('/practitioner')) return null
  return (
    <div className="relative z-20 flex justify-end items-center gap-3 px-6 py-3 print:hidden">
      <Show when="signed-out">
        <SignInButton>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Log In</button>
        </SignInButton>
      </Show>
      <Show when="signed-out">
        <SignUpButton>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Create Account</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <SubscribeButton />
        <UserButton />
      </Show>
    </div>
  )
}
