import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next 16 Receiver — RSC Cross-Version Redirect Demo',
  description: 'Demonstrates RSC header incompatibility fix',
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
