const { withSentryConfig } = require('@sentry/nextjs/config');
const { assertDatabaseTarget, allowsHostedDatabase } = require('./lib/databaseSafety.cjs');
const hostedDatabase = allowsHostedDatabase();
assertDatabaseTarget(process.env.NEXT_PUBLIC_SUPABASE_URL, hostedDatabase);

const onnxCpuFiles = [
  'node_modules/onnxruntime-node/bin/napi-v3/linux/x64/*',
  `node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/*`,
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ONNX loads its native binding dynamically; trace it explicitly for Vercel CPU functions.
  outputFileTracingIncludes: {
    '/api/background-jobs': onnxCpuFiles,
    '/api/pets/*/image-processing': onnxCpuFiles,
  },
  env: {
    NEXT_PUBLIC_DATABASE_MODE: hostedDatabase ? 'hosted' : 'local',
    NEXT_PUBLIC_DATABASE_HOSTS: hostedDatabase ? [
      new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mur-chi.vercel.app').hostname,
      process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].filter(Boolean).join(',') : '',
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    NEXT_PUBLIC_SENTRY_RELEASE: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_SENTRY_RELEASE || '',
  },
  images: {
    remotePatterns: [
      ...(hostedDatabase ? [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }] : [
        { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/**' },
        { protocol: 'http', hostname: 'localhost', port: '54321', pathname: '/storage/v1/object/public/**' },
      ]),
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  // HTML CSP is generated per request in proxy.ts.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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

// Local/offline build дээр SKIP_SENTRY_BUILD=1 тохируулбал source-map upload болон
// Sentry-ийн build plugin-ийг алгасана. Runtime error capture хэвээр ажиллана.
const sentryBuildConfig = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
};

module.exports = process.env.SKIP_SENTRY_BUILD === '1'
  ? nextConfig
  : withSentryConfig(nextConfig, sentryBuildConfig);
