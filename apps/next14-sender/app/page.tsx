import Link from 'next/link'

// Force dynamic rendering so the env var is read at request time
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const receiverUrl = process.env.NEXT16_RECEIVER_URL || 'http://localhost:3001'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: '#000',
          color: '#fff',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          Next.js 14.2.18
        </span>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>
        RSC Cross-Version Redirect Demo
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.6, color: '#666', margin: '0 0 32px' }}>
        This app simulates a Next.js 14 application behind the same domain as a
        Next.js 16 application (via rewrites). Click the links below to trigger
        client-side navigations that carry RSC headers to the Next 16 app.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          border: '1px solid #fee2e2',
          borderRadius: 8,
          padding: 24,
          background: '#fff',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#dc2626' }}>
            Test WITHOUT Fix
          </h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
            Navigates to an unprotected Next 16 route via same-origin rewrite. The incompatible{' '}
            <code>Next-Router-State-Tree</code> header will cause a <strong>500 Internal Server Error</strong>.
          </p>
          <Link
            href="/receiver/no-fix"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#dc2626',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Trigger Redirect → 500 Error
          </Link>
        </div>

        <div style={{
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          padding: 24,
          background: '#fff',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#16a34a' }}>
            Test WITH Fix
          </h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
            Navigates to a protected Next 16 route where middleware strips incompatible RSC headers.
            This will return a <strong>200 OK</strong> with a full page load.
          </p>
          <Link
            href="/receiver/with-fix"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#16a34a',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Trigger Redirect → 200 OK
          </Link>
        </div>
      </div>

      <div style={{
        marginTop: 32,
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 1.5,
      }}>
        <strong>How it works:</strong> When you click a link, Next.js 14{"'"}s client router sends an RSC
        fetch with a <code>Next-Router-State-Tree</code> header. The <code>beforeFiles</code> rewrite
        proxies the request to the Next 16 app, which receives the incompatible header and fails
        to parse it — triggering the 500 error.
        <br /><br />
        <strong>Receiver URL:</strong> <code>{receiverUrl}</code>
      </div>
    </div>
  )
}
