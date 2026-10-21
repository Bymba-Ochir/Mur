// lib/supabaseAdmin.ts
// Service-role (admin) Supabase client — зөвхөн сервер талын API route-уудад.
// Service-role key нь RLS-г тойрч бүх өгөгдөлд хандах боломжтой тул
// энэ клиентийг ХЭЗЭЭ ч client component/hook-оос импортлож болохгүй.
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
