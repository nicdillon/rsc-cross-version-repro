# RSC Cross-Version Repro — Handoff for IDE Agent

## Goal

Reproduce a customer bug where navigating from a **Next.js 14** app to a **Next.js 16** app (both behind the same domain) causes a **500 Internal Server Error** with this message:

```
The router state header was sent but could not be parsed.
```

Then demonstrate that a middleware-based fix on the Next 16 app resolves it.

## Root Cause

The `Next-Router-State-Tree` header schema changed between Next 14 and Next 16. The 5th tuple element is `optional(boolean())` in v14 but `optional(number())` in v16. When the Next 14 client router sends this header to a Next 16 server, `parseAndValidateFlightRouterState()` in Next 16 throws because superstruct validation fails.

## Customer Architecture

The customer has **both apps behind the same domain** via CloudFront → Cloudflare → Vercel. This is critical — RSC headers (`RSC`, `Next-Router-State-Tree`, `Next-Router-Prefetch`, `Next-Url`) are only sent on **same-origin** navigations. Cross-origin navigations trigger full page loads (no RSC headers), so the bug never fires.

## Repo Structure

Turborepo monorepo at `nicdillon/rsc-cross-version-repro`:

```
apps/
  next14-sender/     # Next.js 14.2.18 — the "old" app
    app/
      page.tsx                    # Homepage with two test links
      receiver/no-fix/page.tsx    # Dummy route (registers in client router manifest)
      receiver/with-fix/page.tsx  # Dummy route (registers in client router manifest)
      redirect/no-fix/page.tsx    # Legacy redirect page (no longer linked)
      redirect/with-fix/page.tsx  # Legacy redirect page (no longer linked)
    next.config.js               # beforeFiles rewrite: /receiver/* → Next 16 app
    middleware.ts                 # (if it exists)
  next16-receiver/   # Next.js 16.2.0 — the "new" app
    app/
      no-fix/page.tsx            # Unprotected route
      with-fix/page.tsx          # Protected route
    middleware.ts                # Strips RSC headers on /with-fix requests
turbo.json           # Must include env: ["NEXT16_RECEIVER_URL", "NEXT14_SENDER_URL"]
```

## Deployed Projects (Vercel, team: dev-success-vtest314)

- **Sender**: `rsc-cross-version-repro-next14-sender` → `rsc-cross-version-repro-next14-send.vercel.app`
- **Receiver**: `rsc-cross-version-repro-next16-receiver` → `rsc-cross-version-repro-next16-rece.vercel.app`
- Env var `NEXT16_RECEIVER_URL` is set on the sender project pointing to the receiver's deployment URL.

## How the Repro Should Work

1. User visits the sender app homepage.
2. Clicks **"Test WITHOUT Fix"** → `<Link href="/receiver/no-fix">`.
3. The Next 14 client router recognizes `/receiver/no-fix` as a valid route (because a dummy `page.tsx` exists at that path in the sender app).
4. Client router sends an **RSC fetch** to `/receiver/no-fix` with headers: `RSC: 1`, `Next-Router-State-Tree: [...]`, etc.
5. The `beforeFiles` rewrite in `next.config.js` intercepts the request server-side and proxies it to the Next 16 receiver app.
6. Next 16 receives the request with Next 14's `Next-Router-State-Tree` header → `parseAndValidateFlightRouterState()` fails → **500 error**.

For the **"Test WITH Fix"** link:
- Same flow, but the Next 16 receiver's `middleware.ts` detects the `RSC: 1` header on `/with-fix` and issues a redirect to the same URL — this drops the RSC headers, forcing a clean full-page load → **200 OK**.

## How to Validate

### Success criteria:
- **"Test WITHOUT Fix"** → results in a 500 error (visible in browser as error page, or in Network tab as 500 status)
- **"Test WITH Fix"** → loads the receiver page successfully (200 OK)

### What to check if both routes return 200 (bug not reproducing):

1. **Are the dummy route files present?** `apps/next14-sender/app/receiver/no-fix/page.tsx` and `apps/next14-sender/app/receiver/with-fix/page.tsx` MUST exist. Without them, the Next 14 client router doesn't recognize the paths and falls back to hard navigation (no RSC headers sent).

2. **Open browser DevTools → Network tab.** Click the "no-fix" link and look at the request to `/receiver/no-fix`:
   - Does it have `RSC: 1` in the request headers? If not, the client router is doing a hard navigation — the dummy route files aren't working.
   - Does it have `Next-Router-State-Tree` in the request headers? This is the header that triggers the 500.

3. **Is the rewrite working?** The request to `/receiver/no-fix` should be proxied to the Next 16 app. Check the response — does it come from the Next 16 app or is it rendering the dummy placeholder component? If you see a blank page (the placeholder `return null`), the rewrite isn't intercepting.

4. **Check `turbo.json`** — the `build` task must have `"env": ["NEXT16_RECEIVER_URL", "NEXT14_SENDER_URL"]`. Without this, Turborepo filters out the env vars and the rewrite destination falls back to `http://localhost:3001`.

5. **Hard refresh the sender homepage first** (Ctrl+Shift+R). The client router needs to load fresh to pick up the route manifest. If you previously navigated when the dummy routes didn't exist, the cached route manifest won't include them.

### Alternative approaches if dummy routes don't trigger RSC headers:

The core requirement is getting the Next 14 client router to send RSC headers (`RSC: 1` + `Next-Router-State-Tree`) on a request that reaches the Next 16 app. If the `<Link>` + dummy route approach doesn't work, try:

- **Client-side `router.push('/receiver/no-fix')`** from a client component (with the dummy routes still in place).
- **Middleware redirect in the sender app** that returns HTTP 307 (not RSC-level redirect). Note: Next.js may convert middleware redirects to `x-nextjs-redirect` headers for RSC requests, so this may not work either.
- **Manual fetch with RSC headers** from a client component: `fetch('/receiver/no-fix', { headers: { 'RSC': '1', 'Next-Router-State-Tree': JSON.stringify([...]) } })` — not a realistic customer repro but proves the 500 fires.
- **Prefetch behavior**: `<Link>` prefetches by default. Check if the prefetch request (with `Next-Router-Prefetch: 1`) triggers the error. The prefetch may use a simpler header set.

## Key Files to Edit

- `apps/next14-sender/app/page.tsx` — Homepage with test links
- `apps/next14-sender/app/receiver/*/page.tsx` — Dummy routes for client router manifest registration
- `apps/next14-sender/next.config.js` — `beforeFiles` rewrite config
- `apps/next16-receiver/middleware.ts` — The fix (strips RSC headers)
- `turbo.json` — Must declare env vars

## The Fix (for the customer)

Add middleware to the Next 16 app that detects incoming RSC requests and strips the headers by redirecting to the same URL:

```typescript
// middleware.ts in the Next 16 app
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const isRscRequest = request.headers.get('rsc') === '1'
  if (isRscRequest) {
    const url = request.nextUrl.clone()
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
```

This forces a clean full-page load without the incompatible RSC headers.