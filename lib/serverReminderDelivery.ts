import webpush from 'web-push';
import { isAllowedPushEndpoint } from './pushEndpoint';
import type { createAdminClient } from './supabaseAdmin';

const PAGE_SIZE = 100;

export interface ReminderClaim {
  id: string;
  subscriptions: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
}

interface ReminderConfig<T extends ReminderClaim> {
  rpc: 'claim_due_vaccine_reminders_with_subscriptions' | 'claim_due_medication_reminders_with_subscriptions';
  table: 'my_pets' | 'medications';
  payload: (claim: T) => { title: string; body: string; url: string };
}

/** The RPC joins bounded subscriptions onto v99's atomically claimed page. */
export async function deliverReminderPages<T extends ReminderClaim>(
  admin: ReturnType<typeof createAdminClient>,
  today: string,
  config: ReminderConfig<T>,
): Promise<{ checked: number; sent: number }> {
  let checked = 0;
  let sent = 0;

  while (true) {
    const { data, error } = await admin.rpc(config.rpc, { max_rows: PAGE_SIZE });
    if (error) throw error;
    const claims = (data ?? []) as T[];
    if (!claims.length) break;

    const completedIds: string[] = [];
    for (const claim of claims) {
      checked += 1;
      const payload = JSON.stringify(config.payload(claim));
      let delivered = false;
      for (const sub of claim.subscriptions) {
        if (!isAllowedPushEndpoint(sub.endpoint)) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          sent += 1;
          delivered = true;
        } catch {
          // Expired subscriptions must not prevent delivery to other devices.
        }
      }
      if (delivered || claim.subscriptions.length === 0) completedIds.push(claim.id);
    }

    if (completedIds.length) {
      const { error: updateError } = await admin
        .from(config.table)
        .update({ last_notified_date: today })
        .in('id', completedIds)
        .eq('reminder_claim_date', today);
      if (updateError) console.error('vaccine-reminders: batch update алдаа', config.table, updateError);
    }

    if (claims.length < PAGE_SIZE) break;
  }

  return { checked, sent };
}
