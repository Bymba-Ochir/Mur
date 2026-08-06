// app/api/vaccine-reminders/route.ts
//
// Vercel Cron Job-оор өдөр бүр дуудагдана (vercel.json дотор тохируулсан цагаар).
// Хугацаа болсон/хэтэрсэн амьтдын эзэнд push мэдэгдэл илгээнэ.
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '../../../lib/supabaseAdmin';

export async function GET(request: Request) {
  // Vercel Cron-оос ирсэн хүсэлт эсэхийг шалгана (CRON_SECRET env тохируулсан бол
  // Vercel автоматаар Authorization: Bearer <CRON_SECRET> толгойг нэмдэг)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }

  webpush.setVapidDetails(
    'mailto:mur-mvp@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabaseAdmin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  // Хугацаа болсон/хэтэрсэн, өнөөдөр аль хэдийн мэдэгдээгүй бичлэгүүд
  const { data: duePets, error } = await supabaseAdmin
    .from('my_pets')
    .select('*')
    .lte('next_vaccine_date', today)
    .not('next_vaccine_date', 'is', null)
    .or(`last_notified_date.is.null,last_notified_date.lt.${today}`);

  if (error) {
    console.error('vaccine-reminders: query алдаа', error);
    return NextResponse.json({ error: 'Мэдэгдэл илгээхэд алдаа гарлаа' }, { status: 500 });
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
      } catch {
        // subscription хугацаа дууссан эсвэл цуцлагдсан байж болно — алгасна
      }
    }

    await supabaseAdmin
      .from('my_pets')
      .update({ last_notified_date: today })
      .eq('id', pet.id);
  }

  // ─── Эмийн сануулга ────────────────────────────────────────────────────────
  const { data: dueMeds } = await supabaseAdmin
    .from('medications')
    .select('id, name, dosage, next_reminder_date, last_notified_date, my_pets(user_id, name)')
    .lte('next_reminder_date', today)
    .not('next_reminder_date', 'is', null)
    .or(`last_notified_date.is.null,last_notified_date.lt.${today}`);

  let medsSent = 0;
  for (const med of dueMeds || []) {
    const pet = med.my_pets as unknown as { user_id: string; name: string } | null;
    if (!pet?.user_id) continue;

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', pet.user_id);

    const payload = JSON.stringify({
      title: `💊 ${pet.name}-ийн эмийн сануулга`,
      body: med.dosage ? `${med.name} — ${med.dosage}` : med.name,
      url: '/my-pets',
    });

    for (const sub of subs || []) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        medsSent++;
      } catch {
        // subscription хугацаа дууссан — алгасна
      }
    }

    await supabaseAdmin
      .from('medications')
      .update({ last_notified_date: today })
      .eq('id', med.id);
  }

  return NextResponse.json({
    checked: duePets?.length || 0,
    sent,
    medsChecked: dueMeds?.length || 0,
    medsSent,
  });
}
