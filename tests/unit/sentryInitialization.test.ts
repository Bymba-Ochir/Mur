import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  httpClientIntegration: vi.fn(() => ({ name: 'HttpClient' })),
  captureRouterTransitionStart: vi.fn(),
  captureRequestError: vi.fn(),
}));
import * as Sentry from '@sentry/nextjs';

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@example.ingest.sentry.io/1');
  vi.stubEnv('SENTRY_DSN', 'https://server@example.ingest.sentry.io/1');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', 'preview');
  vi.stubEnv('SENTRY_ENVIRONMENT', 'preview');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_RELEASE', 'test-release');
  vi.stubEnv('SENTRY_RELEASE', 'test-release');
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('Sentry runtime initialization', () => {
  it('initializes browser errors and HTTP 5xx without using the server DSN', async () => {
    const runtimeModule = await import('../../instrumentation-client');
    expect(Sentry.init).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ dsn: 'https://public@example.ingest.sentry.io/1', enabled: true, environment: 'preview', release: 'test-release', initialScope: { tags: { area: 'frontend' } } }));
    expect(Sentry.httpClientIntegration).toHaveBeenCalledWith({ failedRequestStatusCodes: [[500, 599]] });
    expect(runtimeModule.onRouterTransitionStart).toBe(Sentry.captureRouterTransitionStart);
  });

  it.each(['node', 'edge'])('initializes %s runtime with server-only configuration', async (runtime) => {
    if (runtime === 'node') await import('../../sentry.server.config.js');
    else await import('../../sentry.edge.config.js');
    expect(Sentry.init).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ dsn: 'https://server@example.ingest.sentry.io/1', enabled: true, environment: 'preview', release: 'test-release', initialScope: { tags: { area: 'backend' } } }));
  });

  it('remains disabled without a DSN', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    vi.stubEnv('SENTRY_DSN', '');
    await import('../../instrumentation-client');
    await import('../../sentry.server.config.js');
    await import('../../sentry.edge.config.js');
    expect(Sentry.init).toHaveBeenCalledTimes(3);
    for (const call of vi.mocked(Sentry.init).mock.calls) expect(call[0]?.enabled).toBe(false);
  });

  it('exports the Next.js server request error hook', async () => {
    const runtimeModule = await import('../../instrumentation');
    expect(runtimeModule.onRequestError).toBe(Sentry.captureRequestError);
  });
});
