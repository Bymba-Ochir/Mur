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
