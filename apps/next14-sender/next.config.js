/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const receiverUrl = process.env.NEXT16_RECEIVER_URL || 'http://localhost:3001'
    return {
      // "beforeFiles" rewrites are checked before pages/routes,
      // so /receiver/* will proxy to the Next 16 app
      beforeFiles: [
        {
          source: '/receiver/:path*',
          destination: `${receiverUrl}/:path*`,
        },
      ],
    }
  },
}

module.exports = nextConfig
