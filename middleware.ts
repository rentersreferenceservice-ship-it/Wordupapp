import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  if (
    (hostname === 'worduplessongenerator.com' || hostname === 'www.worduplessongenerator.com') &&
    !pathname.startsWith('/practitioner') &&
    !pathname.startsWith('/api')
  ) {
    return NextResponse.redirect(new URL('/practitioner/get-started', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
