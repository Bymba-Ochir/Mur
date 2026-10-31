import type { Breadcrumb, Event } from '@sentry/nextjs';

// Public ingestion DSN for mur-me/mur, not an API/authentication token.
// An explicit empty DSN environment variable disables that runtime.
export const MUR_SENTRY_DSN = 'https://231681d6bf1dfc36c7a5c8481d078437@o4511857896849408.ingest.de.sentry.io/4512350101700690';

const FILTERED = '[Filtered]';
const SENSITIVE_KEY = /authorization|cookie|password|secret|token|api.?key|phone|email|address|latitude|longitude|^lat$|^lng$/i;

export function scrubUrl(value: string): string {
  try {
    const url = new URL(value, 'https://mur.invalid');
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return value.startsWith('/') ? url.pathname : url.toString();
  } catch { return FILTERED; }
}

export function scrubErrorText(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/gi, scrubUrl)
    .replace(/\/[A-Za-z0-9/_-]*\?[^\s"'<>]+/g, scrubUrl)
    .replace(/\bBearer\s+[^\s"',;]+/gi, `Bearer ${FILTERED}`)
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, FILTERED)
    .replace(/((?:password|secret|[a-z_]*token|api[_-]?key)["']?\s*[:=]\s*["']?)[^\s"',;&}]+/gi, `$1${FILTERED}`)
    .replace(/\b(?:\+976[ -]?)?\d{8}\b/g, FILTERED)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, FILTERED);
}

function scrubContext(value: unknown, depth = 0): unknown {
  if (depth > 6) return FILTERED;
  if (typeof value === 'string') return scrubErrorText(value);
  if (Array.isArray(value)) return value.map((item) => scrubContext(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key, SENSITIVE_KEY.test(key) ? FILTERED
        : typeof item === 'string' && /url|request_path|^from$|^to$/i.test(key) ? scrubUrl(item)
          : scrubContext(item, depth + 1),
    ]));
  }
  return value;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  // Console arguments and DOM labels can contain user-entered content.
  if (/^(console|ui)(\.|$)/.test(breadcrumb.category ?? '')) return null;
  const data: Record<string, unknown> = {};
  for (const key of ['url', 'from', 'to', 'method', 'status_code']) {
    const value = breadcrumb.data?.[key];
    if (typeof value === 'string') data[key] = ['url', 'from', 'to'].includes(key) ? scrubUrl(value) : scrubErrorText(value);
    else if (typeof value === 'number') data[key] = value;
  }
  return { ...breadcrumb, message: breadcrumb.message ? scrubErrorText(breadcrumb.message) : undefined, data };
}

export function scrubSentryEvent<T extends Event>(event: T): T {
  if (event.request) {
    event.request = { method: event.request.method, url: event.request.url ? scrubUrl(event.request.url) : undefined };
  }
  delete event.user;
  delete event.extra;
  if (event.message) event.message = scrubErrorText(event.message);
  if (event.logentry) event.logentry = { message: scrubErrorText(event.logentry.message ?? '') };
  if (event.transaction?.includes('?')) event.transaction = event.transaction.split('?')[0];
  if (event.contexts) event.contexts = scrubContext(event.contexts) as Event['contexts'];
  event.breadcrumbs = event.breadcrumbs?.flatMap((crumb) => {
    const safe = scrubBreadcrumb(crumb);
    return safe ? [safe] : [];
  });
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubErrorText(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      delete frame.vars;
      if (frame.filename?.startsWith('http')) frame.filename = scrubUrl(frame.filename);
      if (frame.abs_path?.startsWith('http')) frame.abs_path = scrubUrl(frame.abs_path);
    }
  }
  return event;
}

/** Shared by browser, Node.js and Edge. Error sampling is independent of tracing. */
export const sentryOptions = {
  sampleRate: 1,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  enableLogs: false,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
    genAI: { inputs: false, outputs: false },
  },
  beforeSend: scrubSentryEvent,
  beforeBreadcrumb: scrubBreadcrumb,
};
