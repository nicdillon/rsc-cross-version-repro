import { redirect } from 'next/navigation'

// Force dynamic rendering so the env var is read at request time
export const dynamic = 'force-dynamic'

export default function RedirectWithFix() {
  // Redirect to a same-origin path that is rewritten (proxied) to the Next 16 receiver.
  // The Next 16 middleware on /with-fix strips the incompatible RSC headers,
  // forcing a clean full-page load and avoiding the 500 error.
  redirect('/receiver/with-fix')
}
