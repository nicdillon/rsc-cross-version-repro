import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware that strips incompatible RSC headers on the /with-fix route.
 *
 * When a Next.js 14 client follows a redirect to this Next 16 app, the browser
 * carries over RSC headers (RSC, Next-Router-State-Tree, Next-Router-Prefetch,
 * Next-Url) from the original request. The Next-Router-State-Tree header format
 * changed between versions (e.g., 5th tuple element: boolean in v14, number in v16),
 * causing parseAndValidateFlightRouterState() to throw:
 *
 *   "The router state header was sent but could not be parsed."
 *
 * The fix: detect cross-origin RSC requests and redirect without RSC headers
 * to force a clean full-page load.
 */
export function middleware(request: NextRequest) {
  // Only apply the fix to the /with-fix route
  if (!request.nextUrl.pathname.startsWith('/with-fix')) {
    return NextResponse.next()
  }

  const isRscRequest = request.headers.get('rsc') === '1'

  if (isRscRequest) {
    // Strip RSC headers by issuing a redirect.
    // The browser will follow this redirect as a normal navigation
    // (without RSC headers), resulting in a full-page HTML response.
    const url = request.nextUrl.clone()
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/with-fix', '/no-fix'],
}
