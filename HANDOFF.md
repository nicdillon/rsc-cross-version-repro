# RSC Cross-Version Repro — Handoff

## Summary

When two Next.js apps of different major versions (14 and 16) are served behind the same domain, `<Link>` navigations that cross the app boundary cause a **500 Internal Server Error**:

```
The router state header was sent but could not be parsed.
```

This is a real customer issue. The customer runs Next.js 14 and Next.js 16 apps behind the same domain via CloudFront → Cloudflare → Vercel. We have a working reproduction deployed on Vercel.

## Root Cause

The `Next-Router-State-Tree` header schema changed between Next 14 and Next 16. When the Next 14 client router sends this header to a Next 16 server, `parseAndValidateFlightRouterState()` in Next 16 throws because superstruct validation fails.

### Schema diff

| Element | Next 14 | Next 16 |
|---------|---------|---------|
| [2] | `optional(nullable(string()))` | `optional(nullable(tuple([string, string])))` |
| [3] | `"refetch"` / `"refresh"` | `"refetch"` / `"inside-shared-layout"` / `"metadata-only"` |
| [4] | `optional(boolean())` | `optional(number())` |

### Why it happens

1. User is on a Next 14 page and clicks a `<Link>` to a path served by the Next 16 app.
2. `<Link>` intercepts the click and makes an RSC fetch with headers: `RSC: 1`, `Next-Router-State-Tree: [...]`, `Next-Url`, etc.
3. These headers reach the Next 16 server (via CDN routing or Vercel rewrites).
4. Next 16's `parseAndValidateFlightRouterState()` fails superstruct validation on the v14 header format → **500**.
5. The Next 14 client router catches the 500 and retries as a full page navigation (no RSC headers) → **200**. The user sees a flash of error then the page loads.

## Why Middleware Cannot Fix This

We tested extensively — **no Next.js middleware approach works**, on either the sender or receiver side.

### `NextResponse.next({ request: { headers } })` — headers are force-restored

In `adapter.js`, after middleware returns, Next.js explicitly restores all flight headers regardless of what middleware did:

```js
// adapter.js
// "Flight headers are not overridable / removable so they are applied at the end."
for (const [key, value] of flightHeaders) {
    finalResponse.headers.set(`x-middleware-request-${key}`, value);
    overwrittenHeaders.push(key);
}
```

The flight parameters (`rsc`, `next-router-state-tree`, `next-router-prefetch`, `next-url`) are treated as sacred — middleware cannot strip them.

### `NextResponse.redirect()` — fetch follows with same headers

RSC navigations use `fetch()`. When middleware returns a 307 redirect, `fetch()` follows it transparently and re-sends the same RSC headers on the redirected request. The incompatible headers still reach the server.

## Reproduction

### Repo

https://github.com/nicdillon/rsc-cross-version-repro

Turborepo monorepo with two apps:

```
apps/
  next14-sender/     # Next.js 14.2.18
  next16-receiver/   # Next.js 16.2.0
```

### Deployed URLs

- **Sender:** https://rsc-cross-version-repro-next14-send.vercel.app
- **Receiver:** https://rsc-cross-version-repro-next16-rece.vercel.app
- Vercel team: `dev-success-vtest314`

### How to test

1. Visit the sender app homepage.
2. Click **"Bug: RSC Navigation (500)"** — uses `<Link>`, triggers RSC fetch with incompatible headers → 500 (visible in Network tab as a failed fetch to `/receiver/no-fix?_rsc=...`), followed by a 200 full page recovery.
3. Click **"Fix: Full Page Navigation (200)"** — uses plain `<a>` tag, no RSC headers sent → clean 200.

### How the routing works

- The sender has a `vercel.json` rewrite: `/receiver/:path*` → `https://receiver-app/:path*` (Vercel platform-level rewrite, runs at the edge before Next.js).
- A dummy `page.tsx` at `apps/next14-sender/app/receiver/no-fix/` registers the path in the Next 14 client router's route manifest, causing `<Link>` to send RSC headers.
- No dummy page exists for `/receiver/with-fix`, but this doesn't matter — `<Link>` attempts RSC navigation regardless. Only a plain `<a>` tag avoids sending RSC headers.

## Current Customer Workarounds

1. **Strip RSC headers at the CDN/proxy layer** — Cloudflare Worker or CloudFront Lambda@Edge can remove `rsc`, `next-router-state-tree`, `next-router-prefetch`, `next-router-segment-prefetch`, and `next-url` from requests heading to the Next 16 app. The client router handles the non-RSC response gracefully by falling back to a full page load.
2. **Use `<a>` instead of `<Link>` for cross-app navigations** — bypasses the client router entirely, but loses SPA transitions.
3. **Upgrade all apps to the same version simultaneously** — often not feasible for large teams doing incremental migrations.

None of these are great. The CDN fix requires infrastructure changes. The `<a>` tag fix is fragile (developers have to know which links cross the boundary). The simultaneous upgrade defeats the purpose of incremental migration.

## What We'd Like the Next.js Team to Consider

### 1. Graceful fallback in `parseAndValidateFlightRouterState()` (strongest recommendation)

Instead of throwing a 500 when validation fails, discard the header and fall back to a full-page HTML response. **The client already handles this** — we observed the client router recovering from the 500 by retrying as a document request. The server should do the same thing proactively:

```js
// Instead of throwing, return undefined and render as a normal page request
try {
  return parseAndValidateFlightRouterState(header)
} catch {
  // Version mismatch or malformed header — fall back to full page render
  return undefined
}
```

This would make cross-version same-domain deployments work out of the box, with the only cost being that cross-boundary navigations become full page loads (which is the correct behavior anyway, since the RSC wire format is incompatible).

### 2. Allow middleware to override flight headers

Remove the force-restore behavior in `adapter.js`, or provide an opt-in escape hatch. The current behavior prevents any Next.js-level mitigation. A config flag or a special header that signals "I intentionally stripped these" would let teams add middleware-based fixes during version migrations.

### 3. Version negotiation

Include the Next.js version (or RSC protocol version) in RSC request headers. The server could detect a mismatch and fall back gracefully without attempting to parse an incompatible header format.

## Key Source Files (in Next.js)

| File | Relevance |
|------|-----------|
| `next/dist/server/app-render/parse-and-validate-flight-router-state.js` | The validation function that throws |
| `next/dist/server/app-render/app-render.js` (~line 1557) | Call site in `renderToHTMLOrFlight()` → `parseRequestHeaders()` |
| `next/dist/server/web/adapter.js` (~lines 117-124, 269-278) | Flight header extraction and force-restore after middleware |
| `next/dist/server/lib/router-utils/resolve-routes.js` (~lines 353-378) | `x-middleware-override-headers` application (overridden by adapter) |
| `next/dist/server/app-render/types.js` | `flightRouterStateSchema` definition (differs between versions) |

## Related GitHub Issues

- vercel/next.js#91723 — Same error surface with Vercel Proxy matcher (closed, no repro)
- vercel/next.js#67444 — RSC payload fails through third-party proxies
- vercel/next.js#40481 — Multi-zone relative routing challenges
- vercel/next.js#92330 — Our filed issue (auto-closed by bot for template mismatch)
