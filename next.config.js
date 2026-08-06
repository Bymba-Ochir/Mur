const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  // Security headers. CSP-г аппын бодит хэрэгцээнд тааруулсан:
  // - 'unsafe-inline' script: layout-ийн theme script (dangerouslySetInnerHTML)
  // - 'unsafe-inline' style: styled-jsx
  // - 'unsafe-eval' + jsdelivr/huggingface.co + blob: — browser-ийн CLIP
  //   (transformers.js/ONNX runtime, lib/similarity.ts) заагдсан CDN-ээс ачаалагддаг
  // - supabase storage/realtime, Sentry, fonts, unpkg (leaflet.css)
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://firebasestorage.googleapis.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.sentry.io https://fonts.googleapis.com https://fonts.gstatic.com https://unpkg.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

// Sentry-ийн DSN/токен тохируулаагүй үед ч build амжилттай явахаар, source map
// upload-ыг зөвхөн шаардлагатай тохиргоо байгаа үед л хийнэ (silent: true).
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
