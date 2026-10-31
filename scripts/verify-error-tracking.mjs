// Sends one synthetic backend error to the configured Sentry project.
// Run manually: node --env-file=.env.local scripts/verify-error-tracking.mjs
// It does not call production routes, Supabase, QPay, or mutate application data.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const Sentry = require('@sentry/nextjs');
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) throw new Error('Set NEXT_PUBLIC_SENTRY_DSN or SENTRY_DSN before verification.');

Sentry.init({
  dsn,
  environment: 'monitoring-test',
  defaultIntegrations: false,
  sampleRate: 1,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  enableLogs: false,
  dataCollection: { userInfo: false, cookies: false, httpHeaders: { request: false, response: false }, httpBodies: [], urlQueryParams: false, stackFrameVariables: false },
});

const eventId = Sentry.captureException(new Error(`Mur monitoring verification ${randomUUID()}`), {
  tags: { area: 'backend', operation: 'monitoring-smoke', synthetic: 'true' },
});
if (!await Sentry.flush(5000)) throw new Error('Sentry transport did not finish within 5 seconds.');
console.log(`Sentry verification event: ${eventId}`);
console.log('Confirm the event and the new-issue alert run in https://mur-me.sentry.io/issues/');
