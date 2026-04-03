# RSC Cross-Version Redirect Reproduction

Demonstrates a **500 error** caused by incompatible React Server Component (RSC) headers when a **Next.js 14** app's client-side redirect targets a **Next.js 16** app.

## The Problem

When a Next.js 14 app performs an RSC-level redirect to a Next.js 16 app, the browser carries over the `Next-Router-State-Tree` header from the Next 14 client. The 5th element of the router state tuple changed from `boolean` (Next 14) to `number` (Next 16), causing Next 16's `parseAndValidateFlightRouterState()` to throw:

```
Error: The router state header was sent but could not be parsed.
```

## Architecture

```
apps/
├── next14-sender/     → Next.js 14.2.18 — Has links that trigger RSC redirects
└── next16-receiver/   → Next.js 16.2.0  — Receives the redirect, shows fix vs no-fix
```

## How to Test

1. Open the **Next 14 sender** app
2. Click **"Test WITHOUT fix"** — navigates via RSC redirect to the unprotected Next 16 route → **500 error**
3. Click **"Test WITH fix"** — navigates via RSC redirect to the protected Next 16 route → **200 OK**

The fix strips incompatible RSC headers (`RSC`, `Next-Router-State-Tree`, `Next-Router-Prefetch`, `Next-Url`) in Next.js middleware before they reach the renderer.

## Root Cause Details

| Field | Next 14 Schema | Next 16 Schema |
|-------|---------------|---------------|
| 5th element of state tree tuple | `optional(boolean())` | `optional(number())` |
| 4th element literal values | `"refetch"` \| `"refresh"` | `"refetch"` \| `"inside-shared-layout"` \| `"metadata-only"` |
| Segment tuple | `[string, string, dynamicParamType]` | `[string, string, dynamicParamType, nullable(string[])]` |

When the Next 14 client sends `true` (boolean) as the 5th element, Next 16's superstruct schema validation fails.

## Local Development

```bash
npm install
npm run dev
# Next 14 app → http://localhost:3000
# Next 16 app → http://localhost:3001
```
