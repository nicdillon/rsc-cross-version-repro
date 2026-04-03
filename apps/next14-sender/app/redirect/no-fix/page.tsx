import { redirect } from 'next/navigation'

// Force dynamic rendering so the env var is read at request time
export const dynamic = 'force-dynamic'

export default function RedirectNoFix() {
  const receiverUrl = process.env.NEXT16_RECEIVER_URL || 'http://localhost:3001'
  redirect(`${receiverUrl}/no-fix`)
}
