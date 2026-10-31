import * as Sentry from '@sentry/nextjs';
import { MUR_SENTRY_DSN, sentryOptions } from './lib/sentryOptions';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? MUR_SENTRY_DSN;

Sentry.init({
  ...sentryOptions,
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  initialScope: { tags: { area: 'frontend' } },
  integrations: [Sentry.httpClientIntegration({ failedRequestStatusCodes: [[500, 599]] })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
