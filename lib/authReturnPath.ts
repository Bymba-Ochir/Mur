import { isIdempotencyKey } from './idempotency';
import { listingFilterPath } from './useListingFilters';

const GOOGLE_KEY = 'mur-google-return-path';
const EMAIL_KEY = 'mur-listings-email-return-path';
const EMAIL_RETURN_LIFETIME = 60 * 60 * 1000;

export function authReturnPath(pathname: string, search = '') {
  if (pathname === '/listings') return listingFilterPath(pathname, search);
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
  try { window.sessionStorage.setItem(GOOGLE_KEY, authReturnPath(pathname, search)); }
  catch { /* The callback can still return home if storage is unavailable. */ }
}

export function rememberListingEmailReturnPath() {
  const { pathname, search } = window.location;
  if (pathname !== '/listings') return false;
  try {
    const path = listingFilterPath(pathname, search);
    // A magic link can open in a different tab on the same device.
    window.localStorage.setItem(EMAIL_KEY, JSON.stringify({ path, expiresAt: Date.now() + EMAIL_RETURN_LIFETIME }));
    return true;
  } catch { return false; }
}

export function consumeAuthReturnPath() {
  try {
    const stored = window.sessionStorage.getItem(GOOGLE_KEY);
    if (stored !== null) {
      window.sessionStorage.removeItem(GOOGLE_KEY);
      const [pathname, search] = stored.split('?', 2);
      return authReturnPath(pathname, search);
    }
  } catch { /* Email return paths are stored separately. */ }

  try {
    const stored = window.localStorage.getItem(EMAIL_KEY);
    window.localStorage.removeItem(EMAIL_KEY);
    if (stored) {
      const { path, expiresAt } = JSON.parse(stored);
      if (typeof path === 'string' && typeof expiresAt === 'number' && expiresAt > Date.now()) {
        const [pathname, search] = path.split('?', 2);
        if (pathname === '/listings') return listingFilterPath(pathname, search);
      }
    }
  } catch { /* A missing or invalid saved path falls back to home. */ }
  return '/';
}
