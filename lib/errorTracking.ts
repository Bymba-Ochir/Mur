import * as Sentry from '@sentry/nextjs';
import { isInputValidationError } from './inputValidation';

export interface ErrorLocation { area: 'frontend' | 'backend'; operation: string; }

/** Capture failures deliberately handled by UI/API code, without request bodies. */
export function reportError(error: unknown, location: ErrorLocation): string | undefined {
  if (isInputValidationError(error) || (error instanceof Error && error.message === 'UNAUTHORIZED')) return;
  // DOMException and cross-realm browser aborts do not always extend Error.
  if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return;
  try {
    let exception: Error;
    if (error instanceof Error) {
      exception = error;
    } else {
      // Supabase returns plain objects. Do not attach details/hint/row payloads.
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      const safeCode = /^[A-Z0-9_]{2,32}$/.test(code) ? code : 'UNKNOWN';
      exception = new Error(`Operation failed (${safeCode})`);
      exception.name = 'ServiceError';
    }
    return Sentry.captureException(exception, { tags: { area: location.area, operation: location.operation } });
  } catch {
    // Telemetry must never break a successful mutation or its error response.
    return undefined;
  }
}
