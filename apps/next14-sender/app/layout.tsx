import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next 14 Sender — RSC Cross-Version Bug Reproduction',
  description: 'Demonstrates RSC header incompatibility when a Next 14 server-side redirect targets a Next 16 app on the same domain',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0, background: '#fafafa' }}>
        {children}
      </body>
    </html>
  )
}
