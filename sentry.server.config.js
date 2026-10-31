// sentry.server.config.js
import * as Sentry from '@sentry/nextjs';
import { MUR_SENTRY_DSN, sentryOptions } from './lib/sentryOptions';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? MUR_SENTRY_DSN;

Sentry.init({
  ...sentryOptions,
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  initialScope: { tags: { area: 'backend' } },
});
