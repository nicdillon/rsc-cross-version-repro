export default function HomePage() {
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

      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>
        Next 16 Receiver App
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.6, color: '#666', margin: '0 0 24px' }}>
        This is the receiving end. To trigger the cross-version RSC redirect issue,
        start from the Next 14 sender app.
      </p>

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
        Go to Next 14 Sender App
      </a>

      <div style={{
        marginTop: 32,
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 1.5,
      }}>
        <strong>Routes:</strong><br />
        <code>/no-fix</code> — Unprotected dynamic page (will 500 with cross-version RSC headers)<br />
        <code>/with-fix</code> — Protected by middleware that strips incompatible RSC headers (will 200)
      </div>
    </div>
  )
}
