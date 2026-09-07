import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { DISTRICTS } from '../../../lib/districts';

interface SubscriptionBody { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; district?: unknown; vaccine?: unknown; }

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const endpoint = new URL(request.url).searchParams.get('endpoint');
  if (!endpoint || endpoint.length > 2000) return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await admin.from('push_subscriptions').select('user_id').eq('endpoint', endpoint).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ vaccine: Boolean(data) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Status unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(`push:${getClientIp(request)}`, 8, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээнэ үү.' }, { status: 429 });
    const body = await request.json() as SubscriptionBody;
    const keys = body.keys;
    if (typeof body.endpoint !== 'string' || body.endpoint.length > 2000 || !body.endpoint.startsWith('https://')) return NextResponse.json({ error: 'Push endpoint буруу байна.' }, { status: 400 });
    if (typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string' || keys.p256dh.length > 500 || keys.auth.length > 500) return NextResponse.json({ error: 'Push түлхүүр буруу байна.' }, { status: 400 });
    const district = typeof body.district === 'string' && DISTRICTS.includes(body.district as (typeof DISTRICTS)[number]) ? body.district : null;
    const admin = createAdminClient();
    let userId: string | null = null;
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (token) { const { data } = await admin.auth.getUser(token); userId = data.user?.id ?? null; }
    if (body.vaccine === true && !userId) return NextResponse.json({ error: 'Вакцины сануулгад нэвтрэх шаардлагатай.' }, { status: 401 });
    if (!district && body.vaccine !== true) return NextResponse.json({ error: 'Дүүрэг сонгоно уу.' }, { status: 400 });
    const { data: existing, error: findError } = await admin.from('push_subscriptions').select('district,user_id').eq('endpoint', body.endpoint).maybeSingle();
    if (findError) throw findError;
    const payload = { endpoint: body.endpoint, keys, district: district ?? existing?.district ?? null, user_id: userId ?? existing?.user_id ?? null };
    const { error } = await admin.from('push_subscriptions').upsert(payload, { onConflict: 'endpoint' });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Push бүртгэл хадгалахад алдаа гарлаа.' }, { status: 500 });
  }
}
