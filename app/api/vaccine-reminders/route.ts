import { isAllowedPushEndpoint } from '../../../lib/pushEndpoint';
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '../../../lib/supabaseAdmin';

const PAGE_SIZE = 100;
const MAX_SUBSCRIPTIONS_PER_USER = 50;

type AdminClient = ReturnType<typeof createAdminClient>;

type VaccineClaim = {
  id: string;
  user_id: string;
  name: string;
  next_vaccine_date: string;
  last_notified_date: string | null;
};

type MedicationClaim = {
  id: string;
  user_id: string;
  pet_name: string;
  name: string;
  dosage: string | null;
  next_reminder_date: string;
  last_notified_date: string | null;
};

type PushSubscriptionRow = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('vaccine-reminders: CRON_SECRET тохируулагдаагүй');
    return NextResponse.json({ error: 'Cron тохиргоо дутуу байна.' }, { status: 503 });
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicVapidKey || !privateVapidKey) {
    console.error('vaccine-reminders: VAPID key тохиргоо дутуу');
    return NextResponse.json({ error: 'Push тохиргоо дутуу байна.' }, { status: 503 });
  }

  webpush.setVapidDetails('mailto:mur-mvp@example.com', publicVapidKey, privateVapidKey);
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const subscriptionCache = new Map<string, PushSubscriptionRow[]>();

  const loadSubscriptions = async (userId: string): Promise<PushSubscriptionRow[]> => {
    const cached = subscriptionCache.get(userId);
    if (cached) return cached;
    const { data, error } = await admin
      .from('push_subscriptions')
      .select('endpoint,keys')
      .eq('user_id', userId)
      .limit(MAX_SUBSCRIPTIONS_PER_USER);
    if (error) throw error;
    const rows = (data ?? []) as PushSubscriptionRow[];
    subscriptionCache.set(userId, rows);
    return rows;
  };

  let checked = 0;
  let sent = 0;
  while (true) {
    const { data, error } = await admin.rpc('claim_due_vaccine_reminders', { max_rows: PAGE_SIZE });
    if (error) {
      console.error('vaccine-reminders: claim алдаа', error);
      return NextResponse.json({ error: 'Мэдэгдэл илгээхэд алдаа гарлаа' }, { status: 500 });
    }
    const duePets = (data ?? []) as VaccineClaim[];
    if (!duePets.length) break;

    for (const pet of duePets) {
      checked += 1;
      const subs = await loadSubscriptions(pet.user_id);
      const payload = JSON.stringify({
        title: `💉 ${pet.name}-ийн вакцины хугацаа боллоо`,
        body: 'Амьтныхаа вакциныг цагт нь хийлгэхээ мартуузай.',
        url: '/my-pets',
      });

      let delivered = false;
      for (const sub of subs) {
        if (!isAllowedPushEndpoint(sub.endpoint)) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          sent += 1;
          delivered = true;
        } catch {
          // subscription хугацаа дууссан эсвэл цуцлагдсан байж болно
        }
      }

      if (delivered || subs.length === 0) {
        const { error: updateError } = await admin
          .from('my_pets')
          .update({ last_notified_date: today })
          .eq('id', pet.id)
          .eq('reminder_claim_date', today);
        if (updateError) console.error('vaccine-reminders: pet update алдаа', pet.id, updateError);
      }
    }

    if (duePets.length < PAGE_SIZE) break;
  }

  let medsChecked = 0;
  let medsSent = 0;
  while (true) {
    const { data, error } = await admin.rpc('claim_due_medication_reminders', { max_rows: PAGE_SIZE });
    if (error) {
      console.error('vaccine-reminders: medication claim алдаа', error);
      return NextResponse.json({ error: 'Эмийн сануулга шалгахад алдаа гарлаа.' }, { status: 500 });
    }
    const dueMeds = (data ?? []) as MedicationClaim[];
    if (!dueMeds.length) break;

    for (const med of dueMeds) {
      medsChecked += 1;
      const subs = await loadSubscriptions(med.user_id);
      const payload = JSON.stringify({
        title: `💊 ${med.pet_name}-ийн эмийн сануулга`,
        body: med.dosage ? `${med.name} — ${med.dosage}` : med.name,
        url: '/my-pets',
      });

      let delivered = false;
      for (const sub of subs) {
        if (!isAllowedPushEndpoint(sub.endpoint)) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          medsSent += 1;
          delivered = true;
        } catch {
          // subscription хугацаа дууссан эсвэл цуцлагдсан байж болно
        }
      }

      if (delivered || subs.length === 0) {
        const { error: updateError } = await admin
          .from('medications')
          .update({ last_notified_date: today })
          .eq('id', med.id)
          .eq('reminder_claim_date', today);
        if (updateError) console.error('vaccine-reminders: medication update алдаа', med.id, updateError);
      }
    }

    if (dueMeds.length < PAGE_SIZE) break;
  }

  return NextResponse.json({ checked, sent, medsChecked, medsSent });
}
