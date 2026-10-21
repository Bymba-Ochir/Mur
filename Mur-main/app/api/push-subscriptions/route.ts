import { canUpdatePushSubscription } from '../../../lib/pushOwnership';
import { isAllowedPushEndpoint } from '../../../lib/pushEndpoint';
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
    if (!isAllowedPushEndpoint(body.endpoint)) return NextResponse.json({ error: 'Push endpoint буруу байна.' }, { status: 400 });
    if (typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string' || keys.p256dh.length > 500 || keys.auth.length > 500) return NextResponse.json({ error: 'Push түлхүүр буруу байна.' }, { status: 400 });
    const district = typeof body.district === 'string' && DISTRICTS.includes(body.district as (typeof DISTRICTS)[number]) ? body.district : null;
    const admin = createAdminClient();
    let userId: string | null = null;
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (token) { const { data, error } = await admin.auth.getUser(token); if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); userId = data.user.id; }
    if (body.vaccine === true && !userId) return NextResponse.json({ error: 'Вакцины сануулгад нэвтрэх шаардлагатай.' }, { status: 401 });
    if (!district && body.vaccine !== true) return NextResponse.json({ error: 'Дүүрэг сонгоно уу.' }, { status: 400 });
    const { data: existing, error: findError } = await admin.from('push_subscriptions').select('district,user_id,keys').eq('endpoint', body.endpoint).maybeSingle();
    if (findError) throw findError;
    if (existing && !canUpdatePushSubscription(existing, userId, keys)) {
      return NextResponse.json({ error: 'Push бүртгэлийг шинэчлэх эрхгүй байна.' }, { status: 403 });
    }
    const payload = { endpoint: body.endpoint, keys, district: district ?? existing?.district ?? null, user_id: body.vaccine === true ? userId : existing?.user_id ?? null };
    if (existing) {
      // Compare-and-set: a concurrent claim must not be overwritten.
      let query = admin.from('push_subscriptions').update(payload).eq('endpoint', body.endpoint).eq('keys', JSON.stringify(existing.keys));
      query = existing.user_id ? query.eq('user_id', existing.user_id) : query.is('user_id', null);
      const { data, error } = await query.select('endpoint');
      if (error) throw error;
      if (!data?.length) return NextResponse.json({ error: 'Бүртгэл өөрчлөгдсөн. Дахин оролдоно уу.' }, { status: 409 });
    } else {
      const { error } = await admin.from('push_subscriptions').insert(payload);
      if (error?.code === '23505') return NextResponse.json({ error: 'Дахин оролдоно уу.' }, { status: 409 });
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Push бүртгэл хадгалахад алдаа гарлаа.' }, { status: 500 });
  }
}
