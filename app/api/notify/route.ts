// app/api/notify/route.ts
//
// Supabase Database Webhook-оор дуудагдана (pets хүснэгтэд шинэ мөр INSERT
// хийгдэх бүрд). Тухайн бичлэгийн дүүрэгт бүртгэлтэй push subscription-уудад
// "Nearby Alert" мэдэгдэл илгээнэ.
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  // 1. Webhook-ийн нууц түлхүүрээр баталгаажуулна (хэн ч дуудахаас сэргийлнэ)
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }

  const body = await request.json();
  const pet = body.record; // Supabase webhook payload-ийн шинэ мөр

  if (!pet || !pet.district) {
    return NextResponse.json({ error: 'district байхгүй бичлэг' }, { status: 400 });
  }

  // 2. VAPID тохиргоо
  webpush.setVapidDetails(
    'mailto:mur-mvp@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // 3. Service role key-ээр (RLS-г тойрсон) тухайн дүүргийн subscription-уудыг ав
  const supabaseAdmin = createAdminClient();

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('district', pet.district);

  if (error) {
    console.error('notify: subscription query алдаа', error);
    return NextResponse.json({ error: 'Мэдэгдэл илгээхэд алдаа гарлаа' }, { status: 500 });
  }

  const statusLabel = pet.status === 'lost' ? 'Алдсан' : 'Олдсон';
  const payload = JSON.stringify({
    title: `${statusLabel} ${pet.type} — ${pet.district}`,
    body: `${pet.place || ''} орчимд шинэ мэдэгдэл бүртгэгдлээ.`,
    url: `/pets/${pet.id}`,
  });

  const results = await Promise.allSettled(
    (subs || []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: subs?.length || 0 });
}
