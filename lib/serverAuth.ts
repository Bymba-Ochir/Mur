import type { User } from '@supabase/supabase-js';
import { createAdminClient } from './supabaseAdmin';

export async function requireRequestUser(request: Request): Promise<{ user: User; admin: ReturnType<typeof createAdminClient> }> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHORIZED');
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHORIZED');
  return { user: data.user, admin };
}
