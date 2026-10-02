import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher(['/practitioner/((?!get-started).*)'])

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  if (
    (hostname === 'worduplessongenerator.com' || hostname === 'www.worduplessongenerator.com') &&
    pathname === '/'
  ) {
    return NextResponse.redirect(new URL('/lessons', req.url))
  }

  if (isProtected(req)) {
    const { userId } = await auth()
    if (!userId) {
      const target = new URL('/practitioner/get-started', req.url)
      target.searchParams.set('redirect_url', pathname)
      return NextResponse.redirect(target)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
