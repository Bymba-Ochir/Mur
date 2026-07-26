// app/api/notify/route.js
//
// Supabase Database Webhook-оор дуудагдана (pets хүснэгтэд шинэ мөр INSERT
// хийгдэх бүрд). Тухайн бичлэгийн дүүрэгт бүртгэлтэй push subscription-уудад
// "Nearby Alert" мэдэгдэл илгээнэ.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function POST(request) {
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
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // 3. Service role key-ээр (RLS-г тойрсон) тухайн дүүргийн subscription-уудыг ав
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('district', pet.district);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
