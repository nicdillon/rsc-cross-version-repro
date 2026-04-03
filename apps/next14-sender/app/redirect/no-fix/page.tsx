import { redirect } from 'next/navigation'

export default function RedirectNoFix() {
  const receiverUrl = process.env.NEXT16_RECEIVER_URL || 'http://localhost:3001'
  redirect(`${receiverUrl}/no-fix`)
}
