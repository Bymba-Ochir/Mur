import { isAllowedPushEndpoint } from '../../../lib/pushEndpoint';
// app/api/vaccine-reminders/route.ts
//
// Vercel Cron Job-оор өдөр бүр дуудагдана. Browser/гадаад хүсэлтийг trusted гэж
// үзэхгүй: CRON_SECRET заавал байх бөгөөд яг тохирсон Authorization header шаардана.
// Due өгөгдлийг нэг дор бүгдийг татахгүй, keyset pagination-аар жижиг page-аар уншина.
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '../../../lib/supabaseAdmin';

const PAGE_SIZE = 100;
const MAX_SUBSCRIPTIONS_PER_USER = 50;

type AdminClient = ReturnType<typeof createAdminClient>;

async function loadSubscriptions(admin: AdminClient, userId: string) {
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('endpoint,keys')
    .eq('user_id', userId)
    .limit(MAX_SUBSCRIPTIONS_PER_USER);
  if (error) throw error;
  return data || [];
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('vaccine-reminders: CRON_SECRET тохируулагдаагүй');
    return NextResponse.json({ error: 'Cron тохиргоо дутуу байна.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicVapidKey || !privateVapidKey) {
    console.error('vaccine-reminders: VAPID key тохиргоо дутуу');
    return NextResponse.json({ error: 'Push тохиргоо дутуу байна.' }, { status: 503 });
  }

  webpush.setVapidDetails('mailto:mur-mvp@example.com', publicVapidKey, privateVapidKey);

  const supabaseAdmin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  let checked = 0;
  let sent = 0;
  let petCursor: string | null = null;

  // UUID id-гаар keyset pagination. Processing явцад last_notified_date өөрчлөгдсөн ч
  // offset-based pagination шиг мөр алгасахгүй.
  while (true) {
    let query = supabaseAdmin
      .from('my_pets')
      .select('id,user_id,name,next_vaccine_date,last_notified_date')
      .lte('next_vaccine_date', today)
      .not('next_vaccine_date', 'is', null)
      .or(`last_notified_date.is.null,last_notified_date.lt.${today}`)
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);

    if (petCursor) query = query.gt('id', petCursor);

    const { data: duePets, error } = await query;
    if (error) {
      console.error('vaccine-reminders: query алдаа', error);
      return NextResponse.json({ error: 'Мэдэгдэл илгээхэд алдаа гарлаа' }, { status: 500 });
    }
    if (!duePets?.length) break;

    for (const pet of duePets) {
      checked += 1;
      const subs = await loadSubscriptions(supabaseAdmin, pet.user_id);
      const payload = JSON.stringify({
        title: `💉 ${pet.name}-ийн вакцины хугацаа боллоо`,
        body: 'Амьтныхаа вакциныг цагт нь хийлгэхээ мартуузай.',
        url: '/my-pets',
      });

      for (const sub of subs) {
        if (!isAllowedPushEndpoint(sub.endpoint)) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          sent += 1;
        } catch {
          // subscription хугацаа дууссан эсвэл цуцлагдсан байж болно — алгасна
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('my_pets')
        .update({ last_notified_date: today })
        .eq('id', pet.id);
      if (updateError) console.error('vaccine-reminders: pet update алдаа', pet.id, updateError);
    }

    petCursor = duePets[duePets.length - 1].id;
    if (duePets.length < PAGE_SIZE) break;
  }

  let medsChecked = 0;
  let medsSent = 0;
  let medCursor: string | null = null;

  while (true) {
    let query = supabaseAdmin
      .from('medications')
      .select('id,name,dosage,next_reminder_date,last_notified_date,my_pets(user_id,name)')
      .lte('next_reminder_date', today)
      .not('next_reminder_date', 'is', null)
      .or(`last_notified_date.is.null,last_notified_date.lt.${today}`)
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);

    if (medCursor) query = query.gt('id', medCursor);

    const { data: dueMeds, error } = await query;
    if (error) {
      console.error('vaccine-reminders: medication query алдаа', error);
      return NextResponse.json({ error: 'Эмийн сануулга шалгахад алдаа гарлаа.' }, { status: 500 });
    }
    if (!dueMeds?.length) break;

    for (const med of dueMeds) {
      medsChecked += 1;
      const pet = med.my_pets as unknown as { user_id: string; name: string } | null;
      if (!pet?.user_id) continue;

      const subs = await loadSubscriptions(supabaseAdmin, pet.user_id);
      const payload = JSON.stringify({
        title: `💊 ${pet.name}-ийн эмийн сануулга`,
        body: med.dosage ? `${med.name} — ${med.dosage}` : med.name,
        url: '/my-pets',
      });

      for (const sub of subs) {
        if (!isAllowedPushEndpoint(sub.endpoint)) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          medsSent += 1;
        } catch {
          // subscription хугацаа дууссан — алгасна
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('medications')
        .update({ last_notified_date: today })
        .eq('id', med.id);
      if (updateError) console.error('vaccine-reminders: medication update алдаа', med.id, updateError);
    }

    medCursor = dueMeds[dueMeds.length - 1].id;
    if (dueMeds.length < PAGE_SIZE) break;
  }

  return NextResponse.json({ checked, sent, medsChecked, medsSent });
}
