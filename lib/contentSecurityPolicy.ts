/** A fresh server-generated nonce authorizes framework, theme and styled-jsx output. */
export function contentSecurityPolicy(nonce: string, hosted: boolean, development: boolean, guestSightingEnabled = false) {
  const localHttp = 'http://127.0.0.1:54321 http://localhost:54321';
  const localWs = 'ws://127.0.0.1:54321 ws://localhost:54321';
  const challengeOrigin = 'https://challenges.cloudflare.com';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' https://cdn.jsdelivr.net blob:${guestSightingEnabled ? ` ${challengeOrigin}` : ''}${development ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://unpkg.com`,
    // Leaflet positioning and React's dynamic styles use attributes, not style elements.
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob: ${hosted ? 'https://*.supabase.co' : localHttp} https://firebasestorage.googleapis.com https://tile.openstreetmap.org`,
    `connect-src 'self' blob: ${hosted ? 'https://*.supabase.co wss://*.supabase.co' : localHttp + ' ' + localWs} https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.sentry.io https://fonts.googleapis.com https://fonts.gstatic.com https://unpkg.com`,
    "worker-src 'self' blob:",
    ...(guestSightingEnabled ? [`frame-src ${challengeOrigin}`] : []),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
