import { redirect } from 'next/navigation'

// Force dynamic rendering so redirect runs at request time
export const dynamic = 'force-dynamic'

export default function RedirectPage() {
  // Server-side redirect to a path served by the Next 16 receiver app.
  // The client router follows this redirect and sends RSC headers
  // (RSC: 1, Next-Router-State-Tree, etc.) because a dummy page.tsx
  // at /receiver/no-fix registers the path in the route manifest.
  // Next 16 cannot parse the v14-format headers → 500.
  redirect('/receiver/no-fix/bug')
}
