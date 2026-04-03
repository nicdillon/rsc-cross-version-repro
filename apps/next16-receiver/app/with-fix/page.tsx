import { headers } from 'next/headers'

// Force dynamic rendering so the RSC header is parsed at request time
export const dynamic = 'force-dynamic'

export default async function WithFixPage() {
  const headersList = await headers()
  const senderUrl = process.env.NEXT14_SENDER_URL || 'http://localhost:3000'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
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
        200 OK — Middleware stripped incompatible RSC headers. Page rendered successfully.
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>
        /with-fix Route (Protected by Middleware)
      </h1>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666', margin: '0 0 24px' }}>
        This route is protected by middleware that detects cross-origin RSC requests and
        strips the incompatible headers before they reach the renderer. The browser receives
        a redirect response that forces a clean full-page load.
      </p>

      <div style={{
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 1.6,
      }}>
        <strong>Request headers received (after middleware):</strong><br />
        RSC: <code>{headersList.get('rsc') || '(not set — stripped by middleware)'}</code><br />
        Next-Router-State-Tree: <code>{headersList.get('next-router-state-tree') ? '(present)' : '(not set — stripped by middleware)'}</code><br />
        User-Agent: <code>{headersList.get('user-agent')?.substring(0, 80) || '(not set)'}</code>
      </div>

      <div style={{ marginTop: 24 }}>
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
          Back to Next 14 Sender
        </a>
      </div>
    </div>
  )
}
