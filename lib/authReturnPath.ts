import { isIdempotencyKey } from './idempotency';

const KEY = 'mur-google-return-path';

export function reportReturnPath(pathname: string, search = '') {
  if (pathname !== '/report-lost' && pathname !== '/report-found') return '/';
  const petId = new URLSearchParams(search).get('myPetId');
  return pathname === '/report-lost' && isIdempotencyKey(petId)
    ? pathname + '?' + new URLSearchParams({ myPetId: petId })
    : pathname;
}

export function rememberGoogleReturnPath() {
  const { pathname, search } = window.location;
  // A retry from the callback belongs to the original sign-in attempt.
  if (pathname === '/auth/complete') return;
  try { window.sessionStorage.setItem(KEY, reportReturnPath(pathname, search)); }
  catch { /* The callback can still return home if storage is unavailable. */ }
}

export function consumeGoogleReturnPath() {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    const [pathname, search] = (stored ?? '').split('?', 2);
    return reportReturnPath(pathname, search);
  } catch { return '/'; }
}
