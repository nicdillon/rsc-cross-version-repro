import { redirect } from 'next/navigation'

// Force dynamic rendering so the env var is read at request time
export const dynamic = 'force-dynamic'

export default function RedirectNoFix() {
  // Redirect to a same-origin path that is rewritten (proxied) to the Next 16 receiver.
  // Because this stays on the same origin, the Next 14 client router will carry
  // RSC headers (RSC, Next-Router-State-Tree, etc.) across the redirect,
  // triggering the schema validation error in Next 16.
  redirect('/receiver/no-fix')
}
