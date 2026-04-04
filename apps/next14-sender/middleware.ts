import { NextRequest, NextResponse } from 'next/server'

/**
 * Strips RSC headers on /receiver/with-fix before the rewrite proxies to Next 16.
 *
 * Next 16 validates the Next-Router-State-Tree header before user middleware
 * can intercept, so the headers must be stripped on the sender side.
 */
export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/receiver/with-fix')) {
    return NextResponse.next()
  }

  const isRscRequest = request.headers.get('rsc') === '1'

  if (isRscRequest) {
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
  matcher: ['/receiver/:path*'],
}
