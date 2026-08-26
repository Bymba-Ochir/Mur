import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { DISTRICTS } from '../../../lib/districts';

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
  district?: unknown;
  userId?: unknown;
};

export async function POST(request: Request) {
  const rate = checkRateLimit(`push-subscribe:${getClientIp(request)}`, 10, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Хэт олон хүсэлт илгээлээ' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  let body: SubscriptionBody;
  try {
    body = await request.json() as SubscriptionBody;
  } catch {
    return NextResponse.json({ error: 'JSON хүсэлт буруу байна' }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : '';
  const district = typeof body.district === 'string' && DISTRICTS.some((item) => item === body.district)
    ? body.district
    : null;

  if (!endpoint.startsWith('https://') || endpoint.length > 2048 || !p256dh || !auth) {
    return NextResponse.json({ error: 'Push subscription буруу байна' }, { status: 400 });
  }

  // Client-ээс ирсэн userId-д шууд итгэхгүй, access token-оор баталгаажуулна.
  let userId: string | null = null;
  const authorization = request.headers.get('authorization');
  if (body.userId && authorization?.startsWith('Bearer ')) {
    const admin = createAdminClient();
    const { data } = await admin.auth.getUser(authorization.slice(7));
    if (data.user && data.user.id === body.userId) userId = data.user.id;
  }

  if (!district && !userId) {
    return NextResponse.json({ error: 'Дүүрэг эсвэл хэрэглэгч шаардлагатай' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('push_subscriptions')
    .select('district, user_id')
    .eq('endpoint', endpoint)
    .maybeSingle();

  const { error } = await admin.from('push_subscriptions').upsert({
    endpoint,
    keys: { p256dh, auth },
    // Нэг browser subscription nearby + vaccine хоёуланд ашиглагдаж болно.
    // Нэгийг шинэчлэхдээ нөгөөгийн холбоосыг арилгахгүй хадгална.
    district: district ?? existing?.district ?? null,
    user_id: userId ?? existing?.user_id ?? null,
  }, { onConflict: 'endpoint' });

  if (error) {
    console.error('push-subscriptions: upsert алдаа', error.message);
    return NextResponse.json({ error: 'Мэдэгдлийн бүртгэлийг хадгалж чадсангүй' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, district });
}
