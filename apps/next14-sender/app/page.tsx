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
        This app simulates the customer{"'"}s scenario: a Next.js 14 page component
        calls <code>redirect()</code> to a path served by a Next.js 16 app (via Vercel
        rewrites). After the server-side redirect, the client router follows up with
        an RSC fetch — sending incompatible v14 headers to the Next 16 app.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          border: '1px solid #fee2e2',
          borderRadius: 8,
          padding: 24,
          background: '#fff',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#dc2626' }}>
            Bug: Server Redirect → RSC Navigation (500)
          </h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
            Navigates to <code>/redirect/no-fix</code>, which calls{' '}
            <code>redirect({`'/receiver/no-fix'`})</code> server-side. Because a dummy{' '}
            <code>page.tsx</code> exists at <code>/receiver/no-fix</code> in the sender,
            the client router treats the redirected path as a known route and sends an RSC
            fetch with <code>Next-Router-State-Tree</code>. The rewrite proxies this to the
            Next 16 app, which fails to parse the v14 header format —{' '}
            <strong>500 Internal Server Error</strong>.
          </p>
          <Link
            href="/redirect/no-fix"
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
            Test WITHOUT Fix → 500 Error
          </Link>
        </div>

        <div style={{
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          padding: 24,
          background: '#fff',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#16a34a' }}>
            Fix: Server Redirect → Headers Stripped (200)
          </h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
            Navigates to <code>/redirect/with-fix</code>, which calls{' '}
            <code>redirect({`'/receiver/with-fix'`})</code> server-side. The receiver{"'"}s
            middleware strips the incompatible RSC headers before they reach the Next 16
            renderer, forcing a clean full-page load — <strong>200 OK</strong>.
          </p>
          <Link
            href="/redirect/with-fix"
            prefetch={false}
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
            Test WITH Fix → 200 OK
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
        <strong>How it works:</strong> Both buttons use <code>&lt;Link&gt;</code> to a{' '}
        <code>/redirect/*</code> page that calls <code>redirect()</code> server-side to{' '}
        <code>/receiver/*</code>. Dummy <code>page.tsx</code> files in the sender register
        the <code>/receiver/*</code> paths in the client router{"'"}s route manifest, so after
        the redirect the client sends <code>Next-Router-State-Tree</code> headers. The Vercel
        rewrite proxies the request (with headers) to the Next 16 app. Next 16 cannot parse
        the v14 header format and throws:{' '}
        <em>&quot;The router state header was sent but could not be parsed.&quot;</em>
        <br /><br />
        <strong>Why middleware can{"'"}t fix this on the sender:</strong> Next.js{"'"}s{' '}
        <code>adapter.js</code> force-restores all flight headers (<code>rsc</code>,{' '}
        <code>next-router-state-tree</code>, etc.) after middleware returns — they are
        explicitly marked as &quot;not overridable / removable.&quot; The fix must happen
        outside the sender{"'"}s Next.js: either at the CDN/proxy layer or via middleware on
        the receiver that strips headers before they reach the renderer.
        <br /><br />
        <strong>Receiver URL:</strong> <code>{receiverUrl}</code>
      </div>
    </div>
  )
}
