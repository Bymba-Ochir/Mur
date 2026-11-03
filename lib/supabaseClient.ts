import { createClient } from '@supabase/supabase-js';
import { assertDatabaseTarget, allowsHostedDatabase } from './databaseSafety.cjs';

/** All public clients, including metadata/sitemap, pass the same target guard. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assertDatabaseTarget(url);
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  const browser = typeof window !== 'undefined';
  return createClient(url!, key, {
    auth: { persistSession: browser, autoRefreshToken: browser, detectSessionInUrl: browser },
    global: { fetch: databaseFetch(url!) },
  });
}

/** Local HTTP redirects cannot escape to a hosted project. Realtime uses the
 * same constructor-validated URL, so its WebSocket is local as well. */
export function databaseFetch(baseUrl: string): typeof fetch {
  const origin = assertDatabaseTarget(baseUrl).origin;
  return async (input, init) => {
    const target = assertDatabaseTarget(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, allowsHostedDatabase(), true);
    if (target.origin !== origin) throw new Error('DATABASE_ORIGIN_MISMATCH');
    return fetch(input, { ...init, ...(!allowsHostedDatabase() ? { redirect: 'error' } : {}) });
  };
}
