import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
import * as Sentry from '@sentry/nextjs';
import { reportError } from '../../lib/errorTracking';
import { InputValidationError } from '../../lib/inputValidation';

const location = { area: 'backend', operation: 'test-operation' } as const;
beforeEach(() => { vi.resetAllMocks(); });

describe('shared error reporting', () => {
  it('captures the original exception with stable operation tags and no request body', () => {
    const error = new Error('database unavailable');
    vi.mocked(Sentry.captureException).mockReturnValue('event-id');
    expect(reportError(error, location)).toBe('event-id');
    expect(Sentry.captureException).toHaveBeenCalledExactlyOnceWith(error, { tags: location });
  });

  it('normalizes Supabase objects without leaking row details or hints', () => {
    reportError({ code: 'PGRST202', message: 'request failed', details: 'secret row', hint: 'private' }, location);
    const error = vi.mocked(Sentry.captureException).mock.calls[0][0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ServiceError');
    expect(error.message).toBe('Operation failed (PGRST202)');
    expect(JSON.stringify(vi.mocked(Sentry.captureException).mock.calls)).not.toContain('secret row');
  });

  it.each([
    new InputValidationError('required'),
    new Error('UNAUTHORIZED'),
    new DOMException('cancelled', 'AbortError'),
  ])('does not report an expected validation/auth/cancellation: %s', (error) => {
    reportError(error, location);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('does not trust an arbitrary object code as event metadata', () => {
    reportError({ code: 'Bearer private-secret' }, location);
    const error = vi.mocked(Sentry.captureException).mock.calls[0][0] as Error;
    expect(error.message).toBe('Operation failed (UNKNOWN)');
  });

  it('does not change application behavior when reporting fails', () => {
    vi.mocked(Sentry.captureException).mockImplementation(() => { throw new Error('telemetry unavailable'); });
    expect(reportError(new Error('original failure'), location)).toBeUndefined();
  });
});
