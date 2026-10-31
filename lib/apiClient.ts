import { supabase } from './supabase';
import { reportError } from './errorTracking';

export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Эхлээд нэвтэрнэ үү.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    return await fetch(path, { ...init, headers });
  } catch (error) {
    reportError(error, { area: 'frontend', operation: 'authenticated-fetch' });
    throw error;
  }
}

export async function apiError(response: Response): Promise<Error> {
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  return new Error(payload?.error || 'Үйлдэл амжилтгүй боллоо.');
}
