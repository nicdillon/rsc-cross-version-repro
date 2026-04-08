# RSC Cross-Version Bug Reproduction

When two Next.js apps of different major versions share the same domain, server-side `redirect()` calls that cross the version boundary cause a **500 Internal Server Error**.

## Root Cause

The `Next-Router-State-Tree` header schema changed between Next.js 14 and 16:

| Element | Next 14 | Next 16 |
|---------|---------|---------|
| [2] | `optional(nullable(string()))` | `optional(nullable(tuple([string, string])))` |
| [3] | `"refetch"` \| `"refresh"` | `"refetch"` \| `"inside-shared-layout"` \| `"metadata-only"` |
| [4] | `optional(boolean())` | `optional(number())` |

When a Next 14 page component calls `redirect()` to a path served by the Next 16 app:

1. The Next 14 server responds with a 307 redirect
2. The client router follows the redirect and sends an RSC fetch with v14-format headers (`RSC: 1`, `Next-Router-State-Tree`, etc.)
3. The request reaches the Next 16 server (via Vercel rewrites)
4. Next 16's `parseAndValidateFlightRouterState()` fails superstruct validation on the v14 header → **500**
5. The client catches the 500 and retries as a full page navigation (no RSC headers) → **200** — the user sees a flash of error then the page loads

## Reproduction

### Architecture

```
apps/
├── next14-sender/     → Next.js 14.2.18
│   ├── app/page.tsx              → Homepage with "Reproduce" button
│   ├── app/redirect/page.tsx     → Calls redirect('/receiver/no-fix')
│   └── app/receiver/no-fix/page.tsx → Dummy route (registers path in client router manifest)
└── next16-receiver/   → Next.js 16.2.0
    └── app/no-fix/page.tsx       → Dynamic page that displays request headers
```

The sender's `next.config.js` has a `beforeFiles` rewrite: `/receiver/:path*` → Next 16 receiver app. This proxies cross-app requests at the routing layer.

The dummy `page.tsx` at `/receiver/no-fix` in the sender registers the path in the Next 14 client router's route manifest. This is what causes the client to send RSC headers after the redirect — without it, the client would do a hard navigation (no RSC headers, no bug).

### Deployed

- **Sender (Next 14):** https://rsc-cross-version-repro-next14-send.vercel.app
- **Receiver (Next 16):** https://rsc-cross-version-repro-next16-rece.vercel.app

### Steps

1. Open the sender app
2. Open DevTools → Network tab
3. Click **"Trigger Server Redirect → 500"**
4. Observe:
   - `/redirect` → 200 (server-side redirect fires)
   - `/receiver/no-fix?_rsc=...` → **500** (RSC fetch with v14 headers, Next 16 fails to parse)
   - `/receiver/no-fix` → 200 (client retries as full page navigation)

### Local Development

```bash
npm install
npm run dev
# Next 14 sender → http://localhost:3000
# Next 16 receiver → http://localhost:3001
```

## Why There Is No Workaround

### Middleware cannot strip RSC headers

Next.js's `adapter.js` force-restores all flight headers after middleware returns:

```js
// adapter.js
// "Flight headers are not overridable / removable so they are applied at the end."
for (const [key, value] of flightHeaders) {
    finalResponse.headers.set(`x-middleware-request-${key}`, value);
    overwrittenHeaders.push(key);
}
```

This applies to middleware on both the sender and receiver apps. The headers `rsc`, `next-router-state-tree`, `next-router-prefetch`, `next-router-segment-prefetch`, and `next-url` cannot be removed by any Next.js middleware.

### Redirect-based middleware doesn't help either

RSC navigations use `fetch()`. When middleware returns a 307 redirect, `fetch()` follows it transparently and re-sends the same RSC headers on the redirected request.

### The only current mitigation is outside Next.js

Stripping headers at the CDN/proxy layer (Cloudflare Worker, CloudFront Lambda@Edge, etc.) before requests reach the Next.js server. This is not a reasonable expectation for teams doing incremental version migrations.

## Proposed Fix

### 1. Graceful fallback in `parseAndValidateFlightRouterState()` (strongest recommendation)

Instead of throwing a 500 when validation fails, discard the header and fall back to a full-page HTML response. The client already handles this — it recovers from the 500 by retrying as a document request. The server should do the same thing proactively:

```js
try {
  return parseAndValidateFlightRouterState(header)
} catch {
  // Version mismatch or malformed header — fall back to full page render
  return undefined
}
```

This makes cross-version same-domain deployments work out of the box. The only cost is that cross-boundary navigations become full page loads, which is the correct behavior since the RSC wire format is incompatible across versions.

### 2. Allow middleware to override flight headers

Remove the force-restore behavior in `adapter.js`, or provide an opt-in escape hatch. This would let teams add middleware-based fixes during version migrations.

### 3. Version negotiation

Include the Next.js version (or RSC protocol version) in RSC request headers so the server can detect a mismatch and fall back gracefully.

## Key Source Files (in Next.js)

| File | Relevance |
|------|-----------|
| `next/dist/server/app-render/parse-and-validate-flight-router-state.js` | The validation function that throws |
| `next/dist/server/app-render/app-render.js` (~line 1557) | Call site in `renderToHTMLOrFlight()` → `parseRequestHeaders()` |
| `next/dist/server/web/adapter.js` (~lines 117-124, 269-278) | Flight header extraction and force-restore after middleware |
| `next/dist/server/lib/router-utils/resolve-routes.js` (~lines 353-378) | `x-middleware-override-headers` application (overridden by adapter) |
| `next/dist/server/app-render/types.js` | `flightRouterStateSchema` definition (differs between versions) |
