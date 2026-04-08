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
        RSC Cross-Version Bug Reproduction
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.6, color: '#666', margin: '0 0 32px' }}>
        This Next.js 14 app shares a domain with a Next.js 16 app (via Vercel rewrites).
        A server-side <code>redirect()</code> sends the user to a path served by the
        Next 16 app. The client router follows the redirect with an RSC fetch containing
        v14-format headers that Next 16 cannot parse, causing a <strong>500 Internal
        Server Error</strong>.
      </p>

      <div style={{
        border: '1px solid #fee2e2',
        borderRadius: 8,
        padding: 24,
        background: '#fff',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#dc2626' }}>
          Reproduce the Bug
        </h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
          Navigates to <code>/redirect</code>, a page component that calls{' '}
          <code>redirect({`'/receiver/bug'`})</code>. The server responds with a 307 to{' '}
          <code>/receiver/bug</code>, which is rewritten to the Next 16 app. A dummy{' '}
          <code>page.tsx</code> at <code>/receiver/bug</code> in this app registers the path
          in the client router{"'"}s route manifest, so the client sends RSC headers ({' '}
          <code>RSC: 1</code>, <code>Next-Router-State-Tree</code>) on the follow-up
          request. Next 16 fails to parse the v14 header format and returns a 500.
        </p>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
          Open DevTools → Network tab before clicking. Look for the request to{' '}
          <code>/receiver/bug</code> — it will have RSC headers and return a 500. The client
          router then retries as a full page navigation (no RSC headers) and gets a 200.
        </p>
        <Link
          href="/redirect"
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
          Trigger Server Redirect → 500
        </Link>
      </div>

      <div style={{
        marginTop: 24,
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 1.5,
      }}>
        <strong>Root cause:</strong> The <code>Next-Router-State-Tree</code> header schema
        changed between Next 14 and 16. The 5th tuple element is{' '}
        <code>optional(boolean())</code> in v14 but <code>optional(number())</code> in v16.{' '}
        <code>parseAndValidateFlightRouterState()</code> in Next 16 throws when it receives
        the v14 format:{' '}
        <em>&quot;The router state header was sent but could not be parsed.&quot;</em>
        <br /><br />
        <strong>Why middleware can{"'"}t fix this:</strong> Next.js{"'"}s <code>adapter.js</code>{' '}
        force-restores all flight headers (<code>rsc</code>,{' '}
        <code>next-router-state-tree</code>, etc.) after middleware returns — they are
        explicitly marked as &quot;not overridable / removable.&quot; No Next.js middleware
        on either app can strip these headers.
        <br /><br />
        <strong>Receiver URL:</strong> <code>{receiverUrl}</code>
      </div>
    </div>
  )
}
