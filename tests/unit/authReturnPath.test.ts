// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authReturnPath, consumeAuthReturnPath, rememberGoogleReturnPath, rememberListingEmailReturnPath } from '../../lib/authReturnPath';

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('Google sign-in report return path', () => {
  it('keeps the original report through a callback retry and consumes it after success', () => {
    const report = '/report-lost?myPetId=50000000-0000-4000-8000-000000000021';
    window.history.replaceState(null, '', report);
    rememberGoogleReturnPath();
    window.history.replaceState(null, '', '/auth/complete');
    rememberGoogleReturnPath();
    expect(consumeAuthReturnPath()).toBe(report);
    expect(consumeAuthReturnPath()).toBe('/');
  });

  it('keeps the found-report route and ignores other paths and parameters', () => {
    expect(authReturnPath('/report-found', '?next=//example.invalid')).toBe('/report-found');
    expect(authReturnPath('/report-lost', '?myPetId=/unrelated')).toBe('/report-lost');
    expect(authReturnPath('//example.invalid/report-found')).toBe('/');
  });
});

describe('sign-in from filtered listings', () => {
  const filters = new URLSearchParams({ status: 'found', type: 'Муур', district: 'Сонгинохайрхан', q: 'цагаан' });
  const listing = '/listings?' + filters;

  it('preserves the supported filters and drops unrelated redirect parameters after Google sign-in', () => {
    window.history.replaceState(null, '', listing + '&next=https://example.invalid');
    rememberGoogleReturnPath();
    window.history.replaceState(null, '', '/auth/complete');
    expect(consumeAuthReturnPath()).toBe(listing);
  });

  it('keeps the enabled filters for an email callback opened in a new tab', () => {
    window.history.replaceState(null, '', listing);
    expect(rememberListingEmailReturnPath()).toBe(true);
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/auth/complete');
    expect(consumeAuthReturnPath()).toBe(listing);
    expect(consumeAuthReturnPath()).toBe('/');
  });

  it('ignores an expired email return path', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    window.history.replaceState(null, '', listing);
    rememberListingEmailReturnPath();
    now.mockReturnValue(61 * 60 * 1000);
    expect(consumeAuthReturnPath()).toBe('/');
  });
});
