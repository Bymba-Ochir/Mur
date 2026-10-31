import { describe, expect, it } from 'vitest';
import type { Event } from '@sentry/nextjs';
import { scrubBreadcrumb, scrubErrorText, scrubSentryEvent, sentryOptions } from '../../lib/sentryOptions';

describe('Sentry data minimization', () => {
  it('removes auth headers, query parameters, cookies, user identity and request bodies', () => {
    const event: Event = {
      request: { url: 'https://mur-chi.vercel.app/api/qpay/callback?secret=private#fragment', method: 'POST', headers: { Authorization: 'Bearer private' }, cookies: { session: 'private' }, query_string: 'secret=private', data: { amount: 123, message: 'private donor' }, env: { SECRET: 'private' } },
      user: { email: 'private@example.com', ip_address: '127.0.0.1' },
      extra: { responseBody: 'private payload' },
    };
    const safe = scrubSentryEvent(event);
    expect(safe.request).toEqual({ url: 'https://mur-chi.vercel.app/api/qpay/callback', method: 'POST' });
    expect(safe.user).toBeUndefined();
    expect(safe.extra).toBeUndefined();
    expect(JSON.stringify(safe)).not.toContain('private');
  });

  it('keeps debugging stack locations without frame locals or signed URLs', () => {
    const event: Event = { exception: { values: [{ type: 'TypeError', value: 'Fetch failed https://mur.test/api?statusToken=private', stacktrace: { frames: [{ filename: 'https://mur.test/app.js?token=private', function: 'save', lineno: 12, vars: { password: 'private' } }] } }] } };
    const safe = scrubSentryEvent(event);
    expect(safe.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({ filename: 'https://mur.test/app.js', function: 'save', lineno: 12 });
    expect(JSON.stringify(safe)).not.toContain('private');
  });

  it('scrubs nested Next.js request paths and extra exception message credentials', () => {
    const safe = scrubSentryEvent({ contexts: { nextjs: { request_path: '/auth/callback?code=private', token: 'private', nested: { email: 'private@example.com' } } } });
    expect(JSON.stringify(safe)).not.toContain('private');
    expect(scrubErrorText('Bearer private secret=private token=private user@example.com 99112233')).not.toContain('private');
    expect(scrubErrorText('https://user:private@example.com/path?code=private')).toBe('https://example.com/path');
  });

  it('drops console/UI data and keeps only safe HTTP breadcrumb fields', () => {
    expect(scrubBreadcrumb({ category: 'console', message: 'private' })).toBeNull();
    expect(scrubBreadcrumb({ category: 'ui.click', message: 'private' })).toBeNull();
    expect(scrubBreadcrumb({ category: 'fetch', data: { url: 'https://mur.test/api?secret=private', method: 'GET', status_code: 500, response_body: 'private' } })?.data).toEqual({ url: 'https://mur.test/api', method: 'GET', status_code: 500 });
  });

  it('records all errors while disabling body, identity, query, trace and log collection', () => {
    expect(sentryOptions.sampleRate).toBe(1);
    expect(sentryOptions.tracesSampleRate).toBe(0);
    expect(sentryOptions.sendDefaultPii).toBe(false);
    expect(sentryOptions.enableLogs).toBe(false);
    expect(sentryOptions.dataCollection).toMatchObject({ userInfo: false, cookies: false, httpBodies: [], urlQueryParams: false, databaseQueryData: false });
  });
});
