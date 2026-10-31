import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '../../../lib/supabaseAdmin';
import { deliverReminderPages, type ReminderClaim } from '../../../lib/serverReminderDelivery';

interface VaccineClaim extends ReminderClaim { name: string; }
interface MedicationClaim extends ReminderClaim { pet_name: string; name: string; dosage: string | null; }

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

  try {
    const vaccines = await deliverReminderPages<VaccineClaim>(admin, today, {
      rpc: 'claim_due_vaccine_reminders_with_subscriptions',
      table: 'my_pets',
      payload: (pet) => ({
        title: `💉 ${pet.name}-ийн вакцины хугацаа боллоо`,
        body: 'Амьтныхаа вакциныг цагт нь хийлгэхээ мартуузай.',
        url: '/my-pets',
      }),
    });
    const medications = await deliverReminderPages<MedicationClaim>(admin, today, {
      rpc: 'claim_due_medication_reminders_with_subscriptions',
      table: 'medications',
      payload: (med) => ({
        title: `💊 ${med.pet_name}-ийн эмийн сануулга`,
        body: med.dosage ? `${med.name} — ${med.dosage}` : med.name,
        url: '/my-pets',
      }),
    });
    return NextResponse.json({ checked: vaccines.checked, sent: vaccines.sent, medsChecked: medications.checked, medsSent: medications.sent });
  } catch (error) {
    console.error('vaccine-reminders: claim алдаа', error);
    return NextResponse.json({ error: 'Мэдэгдэл илгээхэд алдаа гарлаа' }, { status: 500 });
  }
}
