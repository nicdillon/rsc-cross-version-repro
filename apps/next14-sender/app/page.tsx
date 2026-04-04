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
        Next.js 16 application (via Vercel rewrites). The two tests below show how
        a dummy route in the sender{"'"}s route manifest causes the client router to
        send incompatible RSC headers to the Next 16 app.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          border: '1px solid #fee2e2',
          borderRadius: 8,
          padding: 24,
          background: '#fff',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#dc2626' }}>
            Bug: RSC Navigation (500)
          </h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
            A dummy <code>page.tsx</code> exists at <code>/receiver/no-fix</code> in the sender,
            so the client router treats it as a known route and sends an RSC fetch with{' '}
            <code>Next-Router-State-Tree</code>. The rewrite proxies this to the Next 16 app,
            which fails to parse the v14 header format — <strong>500 Internal Server Error</strong>.
          </p>
          <Link
            href="/receiver/no-fix"
            prefetch={false}
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
            Fix: Full Page Navigation (200)
          </h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
            Uses a plain <code>&lt;a&gt;</code> tag instead of <code>&lt;Link&gt;</code>, which
            bypasses the client router entirely and triggers a full page navigation (no RSC headers).
            The rewrite proxies a clean request — <strong>200 OK</strong>.
          </p>
          <a
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
            Full Page Navigation → 200 OK
          </a>
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
        <strong>How it works:</strong> The Next 14 client router sends RSC headers only for paths it
        recognizes in its route manifest. A dummy <code>page.tsx</code> in the sender registers
        the path, causing the client to send <code>Next-Router-State-Tree</code> on navigation.
        The Vercel rewrite proxies the request (with headers) to the Next 16 app. Next 16
        cannot parse the v14 header format (boolean vs number in the 5th tuple element)
        and throws: <em>&quot;The router state header was sent but could not be parsed.&quot;</em>
        <br /><br />
        <strong>Why middleware can{"'"}t fix this:</strong> Next.js{"'"}s <code>adapter.js</code> force-restores
        all flight headers (<code>rsc</code>, <code>next-router-state-tree</code>, etc.) after
        middleware returns — they are explicitly marked as &quot;not overridable / removable.&quot;
        The fix must happen outside Next.js: either at the CDN/proxy layer (strip headers)
        or by ensuring the client router doesn{"'"}t treat cross-app paths as known routes.
        <br /><br />
        <strong>Receiver URL:</strong> <code>{receiverUrl}</code>
      </div>
    </div>
  )
}
