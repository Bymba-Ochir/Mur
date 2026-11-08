import { after } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from './supabaseAdmin';
import { limitServiceRequest } from './apiRateLimit';
import { reportError } from './errorTracking';
import { isAllowedPushEndpoint } from './pushEndpoint';
import { ownedPetPhotoStoragePath } from './storageObjectPath';
import { GUEST_SIGHTING_PHOTO_BUCKET, SIGHTING_PHOTO_BUCKET, sightingPhotoPathParts } from './sightingPhoto';

type AdminClient = ReturnType<typeof createAdminClient>;
type Payload = Record<string, unknown>;
export interface BackgroundJob {
  id: string;
  kind: 'nearby-push' | 'sighting-notification' | 'storage-cleanup' | 'avatar-cleanup';
  payload: Payload;
  cursor_id: string | null;
  lease_token: string;
  attempts: number;
  created_at: string;
}

const PUSH_PAGE_SIZE = 20;
const PUSH_CONCURRENCY = 5;
const MAX_JOBS_PER_RUN = 10;
const RUN_BUDGET_MS = 20_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(payload: Payload, key: string): string {
  const value = payload[key];
  if (typeof value !== 'string') throw new Error('Invalid background job payload');
  return value;
}

async function deliverNearbyPage(admin: AdminClient, job: BackgroundJob): Promise<string | null> {
  const petId = text(job.payload, 'petId');
  if (!UUID.test(petId)) throw new Error('Invalid background pet ID');
  const { data: pet, error: petError } = await admin.from('pets').select('id,resolved').eq('id', petId).maybeSingle();
  if (petError) throw petError;
  if (!pet || pet.resolved) return null;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error('Background push configuration is missing');
  webpush.setVapidDetails('mailto:mur-mvp@example.com', publicKey, privateKey);

  let query = admin.from('push_subscriptions')
    .select('id,endpoint,keys').eq('district', text(job.payload, 'district'))
    .lte('created_at', job.created_at).order('id', { ascending: true }).limit(PUSH_PAGE_SIZE);
  if (job.cursor_id) query = query.gt('id', job.cursor_id);
  const { data, error } = await query;
  if (error) throw error;
  const subscriptions = data ?? [];
  const payload = JSON.stringify({
    title: `${job.payload.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${text(job.payload, 'type')} — ${text(job.payload, 'district')}`,
    body: `${text(job.payload, 'place')} орчимд шинэ мэдэгдэл бүртгэгдлээ.`,
    url: `/pets/${petId}`, tag: `nearby:${petId}`,
  });

  let transientFailure = false;
  for (let offset = 0; offset < subscriptions.length; offset += PUSH_CONCURRENCY) {
    await Promise.all(subscriptions.slice(offset, offset + PUSH_CONCURRENCY).map(async (sub) => {
      if (!isAllowedPushEndpoint(sub.endpoint)) return;
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, {
          timeout: 3000, TTL: 3600, topic: job.id.replaceAll('-', ''),
        });
      } catch (error) {
        const status = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : null;
        if (status === 404 || status === 410) {
          const { error: deleteError } = await admin.from('push_subscriptions').delete()
            .eq('id', sub.id).eq('endpoint', sub.endpoint);
          if (deleteError) transientFailure = true;
        } else {
          transientFailure = true;
        }
      }
    }));
  }
  // Retry the page without moving its cursor. Stable push tags collapse repeats;
  // an external push provider cannot participate in our database transaction.
  if (transientFailure) throw new Error('Background push delivery temporarily failed');
  return subscriptions.length === PUSH_PAGE_SIZE ? subscriptions[subscriptions.length - 1].id : null;
}

async function executeJob(admin: AdminClient, job: BackgroundJob): Promise<string | null> {
  if (job.kind === 'nearby-push') return deliverNearbyPage(admin, job);
  if (job.kind === 'sighting-notification') {
    const ownerId = text(job.payload, 'ownerId');
    const sightingId = text(job.payload, 'sightingId');
    const petId = text(job.payload, 'petId');
    if (![ownerId, sightingId, petId].every(id => UUID.test(id))) throw new Error('Invalid background notification ID');
    const guest = job.payload.guest === true;
    const place = guest ? '' : text(job.payload, 'place');
    const { error } = await admin.from('notifications').insert({
      id: sightingId, user_id: ownerId, type: 'sighting',
      title: 'Таны амьтныг харсан мэдээлэл ирлээ',
      body: place ? `${place} орчим харсан мэдээлэл нэмэгдлээ.` : 'Шинэ харсан мэдээлэл нэмэгдлээ.',
      href: `/pets/${petId}${guest ? '#guest-sightings' : ''}`,
    });
    // Unique IDs make crash/retry delivery idempotent. A deleted recipient no
    // longer needs the notification (the only FK here is notifications.user_id).
    if (error && error.code !== '23505' && error.code !== '23503') throw error;
    return null;
  }
  const guestPhotoPath = job.payload.guestSightingPhotoPath;
  const isGuestPhoto = typeof guestPhotoPath === 'string';
  const sightingPhotoPath = isGuestPhoto ? guestPhotoPath : job.payload.sightingPhotoPath;
  if (job.kind === 'storage-cleanup' && typeof sightingPhotoPath === 'string') {
    const parts = sightingPhotoPathParts(sightingPhotoPath);
    if (!parts) throw new Error('Invalid sighting cleanup path');
    const { data, error } = await admin.from(isGuestPhoto ? 'guest_sightings' : 'sightings')
      .select('photo_path').eq(isGuestPhoto ? 'submission_key' : 'id', parts.sightingId).maybeSingle();
    if (error) throw error;
    if (data?.photo_path !== sightingPhotoPath) {
      const bucket = isGuestPhoto ? GUEST_SIGHTING_PHOTO_BUCKET : SIGHTING_PHOTO_BUCKET;
      const { error: removeError } = await admin.storage.from(bucket).remove([sightingPhotoPath]);
      if (removeError) throw removeError;
    }
    return null;
  }
  const ownerId = text(job.payload, 'ownerId');
  if (!UUID.test(ownerId)) throw new Error('Invalid background storage owner');
  if (job.kind === 'avatar-cleanup') {
    const { data, error: userError } = await admin.auth.admin.getUserById(ownerId);
    if (data.user) throw new Error('Avatar owner still exists');
    if (userError && userError.status !== 404 && userError.code !== 'user_not_found') throw new Error('Cannot verify deleted avatar owner');
    const { error } = await admin.storage.from('avatars').remove(
      ['avatar.jpg', 'avatar.png', 'avatar.webp'].map(name => `${ownerId}/${name}`),
    );
    if (error) throw error;
    return null;
  }
  if (job.kind !== 'storage-cleanup' || !Array.isArray(job.payload.urls) || job.payload.urls.length > 4) {
    throw new Error('Invalid background storage payload');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Storage project configuration is missing');
  const urls = job.payload.urls.filter((url): url is string => typeof url === 'string');
  // Keep files still referenced by another listing. Deletion paths themselves
  // are always verified against this project and the database-recorded owner.
  const referenced = new Set<string>();
  if (urls.length) {
    const { data, error } = await admin.rpc('referenced_listing_photo_urls', { target_urls: urls });
    if (error) throw error;
    for (const row of data ?? []) if (typeof row.url === 'string') referenced.add(row.url);
  }
  const paths = [...new Set(urls.filter(url => !referenced.has(url))
    .map(url => ownedPetPhotoStoragePath(url, ownerId, process.env.NEXT_PUBLIC_SUPABASE_URL))
    .filter((path): path is string => Boolean(path)))];
  if (paths.length) {
    const { error } = await admin.storage.from('pet-photos').remove(paths);
    if (error) throw error;
  }
  return null;
}

/** One leased job/page at a time; no unbounded queue or recipient reads. */
export async function runBackgroundJobs(admin: AdminClient = createAdminClient()) {
  const deadline = Date.now() + RUN_BUDGET_MS;
  let processed = 0;
  let failed = 0;
  while (processed < MAX_JOBS_PER_RUN && Date.now() < deadline) {
    const { data, error } = await admin.rpc('claim_background_job');
    if (error) throw error;
    const job = (Array.isArray(data) ? data[0] : data) as BackgroundJob | null;
    if (!job) break;
    processed += 1;
    let cursor: string | null;
    try {
      cursor = await executeJob(admin, job);
    } catch {
      failed += 1;
      // Never report endpoints, payloads, storage paths, or provider bodies.
      reportError(new Error(`Background ${job.kind} failed${job.attempts >= 8 ? ': retries exhausted' : ''}`), {
        area: 'backend', operation: `background-job:${job.kind}`,
      });
      const { data: retried, error: retryError } = await admin.rpc('finish_background_job', {
        target_id: job.id, target_lease: job.lease_token, outcome: 'retry', next_cursor: null,
      });
      if (retryError) throw retryError;
      if (!retried) throw new Error('Background job lease lost');
      continue;
    }
    const { data: finished, error: finishError } = await admin.rpc('finish_background_job', {
      target_id: job.id, target_lease: job.lease_token,
      outcome: cursor ? 'continue' : 'done', next_cursor: cursor,
    });
    if (finishError) throw finishError;
    if (!finished) throw new Error('Background job lease lost');
  }
  return { processed, failed };
}

/** after() keeps Vercel alive after the response; the DB queue survives a crash. */
export function scheduleBackgroundJobs(admitted = false): void {
  try {
    after(async () => {
      try {
        if (!admitted && await limitServiceRequest('background-jobs')) return;
        await runBackgroundJobs();
      } catch {
        reportError(new Error('Background worker failed'), { area: 'backend', operation: 'background-worker' });
      }
    });
  } catch {
    // A scheduler/cron invocation can recover already-committed outbox rows.
    reportError(new Error('Background worker wake-up failed'), { area: 'backend', operation: 'background-worker-schedule' });
  }
}
