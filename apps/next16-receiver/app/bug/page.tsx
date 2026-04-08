import { headers } from 'next/headers'

// Force dynamic rendering so headers are read at request time
export const dynamic = 'force-dynamic'

export default async function BugPage() {
  const headersList = await headers()
  const senderUrl = process.env.NEXT14_SENDER_URL || 'http://localhost:3000'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: '#0070f3',
          color: '#fff',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          Next.js 16.2.0
        </span>
      </div>

      <div style={{
        padding: '16px 20px',
        background: '#dcfce7',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        marginBottom: 24,
        fontSize: 15,
        fontWeight: 500,
        color: '#166534',
      }}>
        200 OK — This page rendered successfully.
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>
        Next 16 Receiver App
      </h1>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666', margin: '0 0 24px' }}>
        If you see this page, the request did not carry incompatible RSC headers.
        When accessed via a server-side redirect from the Next 14 sender app, this
        page returns a <strong>500 error</strong> because the v14-format{' '}
        <code>Next-Router-State-Tree</code> header fails schema validation in Next 16.
        The client router then retries as a full page navigation (no RSC headers)
        and this page loads normally.
      </p>

      <div style={{
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 1.6,
        marginBottom: 24,
      }}>
        <strong>Request headers received:</strong><br />
        RSC: <code>{headersList.get('rsc') || '(not set)'}</code><br />
        Next-Router-State-Tree: <code>{headersList.get('next-router-state-tree') ? '(present)' : '(not set)'}</code><br />
        User-Agent: <code>{headersList.get('user-agent')?.substring(0, 80) || '(not set)'}</code>
      </div>

      <a
        href={senderUrl}
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: '#000',
          color: '#fff',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        Back to Next 14 Sender App
      </a>
    </div>
  )
}
