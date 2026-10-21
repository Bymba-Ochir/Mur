import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  let database = false;
  if (configured) {
    try {
      const { error } = await createAdminClient().from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
      database = !error;
    } catch { database = false; }
  }
  const healthy = configured && database;
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
    || process.env.npm_package_version
    || 'local';
  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', version, checks: { configuration: configured, database }, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
