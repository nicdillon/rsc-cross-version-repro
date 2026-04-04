// This file exists solely to register the route in the Next 14 client router's
// route manifest. The beforeFiles rewrite in next.config.js intercepts requests
// to /receiver/* and proxies them to the Next 16 receiver app BEFORE this file
// is ever served. Without this file, the client router treats /receiver/with-fix
// as an unknown route and falls back to a hard navigation (no RSC headers).
export default function Placeholder() {
  return null
}
