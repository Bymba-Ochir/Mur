// app/api/vaccine-reminders/route.js
//
// Vercel Cron Job-оор өдөр бүр дуудагдана (vercel.json дотор тохируулсан цагаар).
// Хугацаа болсон/хэтэрсэн амьтдын эзэнд push мэдэгдэл илгээнэ.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function GET(request) {
  // Vercel Cron-оос ирсэн хүсэлт эсэхийг шалгана (CRON_SECRET env тохируулсан бол
  // Vercel автоматаар Authorization: Bearer <CRON_SECRET> толгойг нэмдэг)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }

  webpush.setVapidDetails(
    'mailto:mur-mvp@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const today = new Date().toISOString().slice(0, 10);

  // Хугацаа болсон/хэтэрсэн, өнөөдөр аль хэдийн мэдэгдээгүй бичлэгүүд
  const { data: duePets, error } = await supabaseAdmin
    .from('my_pets')
    .select('*')
    .lte('next_vaccine_date', today)
    .not('next_vaccine_date', 'is', null)
    .or(`last_notified_date.is.null,last_notified_date.lt.${today}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const pet of duePets || []) {
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', pet.user_id);

    const payload = JSON.stringify({
      title: `💉 ${pet.name}-ийн вакцины хугацаа боллоо`,
      body: 'Амьтныхаа вакциныг цагт нь хийлгэхээ мартуузай.',
      url: '/my-pets',
    });

    for (const sub of subs || []) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        sent++;
      } catch (e) {
        // subscription хугацаа дууссан эсвэл цуцлагдсан байж болно — алгасна
      }
    }

    await supabaseAdmin
      .from('my_pets')
      .update({ last_notified_date: today })
      .eq('id', pet.id);
  }

  return NextResponse.json({ checked: duePets?.length || 0, sent });
}
