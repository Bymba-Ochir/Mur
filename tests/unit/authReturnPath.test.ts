// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { consumeGoogleReturnPath, rememberGoogleReturnPath, reportReturnPath } from '../../lib/authReturnPath';

afterEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('Google sign-in report return path', () => {
  it('keeps the original report through a callback retry and consumes it after success', () => {
    const report = '/report-lost?myPetId=50000000-0000-4000-8000-000000000021';
    window.history.replaceState(null, '', report);
    rememberGoogleReturnPath();
    window.history.replaceState(null, '', '/auth/complete');
    rememberGoogleReturnPath();
    expect(consumeGoogleReturnPath()).toBe(report);
    expect(consumeGoogleReturnPath()).toBe('/');
  });

  it('keeps the found-report route and ignores other paths and parameters', () => {
    expect(reportReturnPath('/report-found', '?next=//example.invalid')).toBe('/report-found');
    expect(reportReturnPath('/report-lost', '?myPetId=/unrelated')).toBe('/report-lost');
    expect(reportReturnPath('//example.invalid/report-found')).toBe('/');
  });
});
