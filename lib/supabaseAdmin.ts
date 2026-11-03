// lib/supabaseAdmin.ts
// Service-role (admin) Supabase client — зөвхөн сервер талын API route-уудад.
// Service-role key нь RLS-г тойрч бүх өгөгдөлд хандах боломжтой тул
// энэ клиентийг ХЭЗЭЭ ч client component/hook-оос импортлож болохгүй.
import { createClient } from '@supabase/supabase-js';
import { assertDatabaseTarget } from './databaseSafety.cjs';
import { databaseFetch } from './supabaseClient';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  assertDatabaseTarget(url);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  return createClient(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: databaseFetch(url) } },
  );
}
