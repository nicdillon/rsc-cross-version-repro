import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware that strips incompatible RSC headers on the /with-fix route.
 *
 * The Next-Router-State-Tree header format changed between Next 14 and 16
 * (5th tuple element: boolean in v14, number in v16), causing
 * parseAndValidateFlightRouterState() to throw:
 *
 *   "The router state header was sent but could not be parsed."
 *
 * The fix: strip RSC headers from the incoming request so Next.js processes
 * it as a normal page request instead of an RSC request. A redirect-based
 * approach does NOT work because fetch() follows 307 redirects with the
 * same headers, re-sending the incompatible RSC headers.
 */
export function middleware(request: NextRequest) {
  // Only apply the fix to the /with-fix route
  if (!request.nextUrl.pathname.startsWith('/with-fix')) {
    return NextResponse.next()
  }

  const isRscRequest = request.headers.get('rsc') === '1'

  if (isRscRequest) {
    // Strip RSC headers by overriding the request headers passed downstream.
    // This removes the incompatible headers before Next.js tries to parse them.
    const cleanHeaders = new Headers(request.headers)
    cleanHeaders.delete('rsc')
    cleanHeaders.delete('next-router-state-tree')
    cleanHeaders.delete('next-router-prefetch')
    cleanHeaders.delete('next-router-segment-prefetch')
    cleanHeaders.delete('next-url')

    return NextResponse.next({
      request: {
        headers: cleanHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/with-fix', '/no-fix'],
}
