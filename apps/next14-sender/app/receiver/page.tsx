// Dummy route: registers /receiver in the Next 14 client router's route manifest.
// The beforeFiles rewrite in next.config.js proxies /receiver to the Next 16 app
// before this page is ever served. Without this file, the client router would not
// recognize /receiver as a known route and would skip sending RSC headers.
export default function Placeholder() {
  return null
}
