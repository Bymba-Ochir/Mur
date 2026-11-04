import { after } from 'next/server';
import { createHash } from 'node:crypto';
import { createAdminClient } from './supabaseAdmin';
import { ownedPetPhotoStoragePath } from './storageObjectPath';
import { limitServiceRequest } from './apiRateLimit';
import { reportError } from './errorTracking';

type AdminClient = ReturnType<typeof createAdminClient>;
interface ImageJob { id: string; lease_token: string; payload: { petId: string; revision: string }; }
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function runPetImageJob(admin: AdminClient = createAdminClient()): Promise<boolean> {
  const claimed = await admin.rpc('claim_pet_image_job');
  if (claimed.error) throw claimed.error;
  const job = (Array.isArray(claimed.data) ? claimed.data[0] : claimed.data) as ImageJob | null;
  if (!job) return false;
  let outcome: 'done' | 'retry' = 'done';
  try {
    const { data: pet, error } = await admin.from('pets')
      .select('id,created_by,embedding_photo_url,embedding_revision').eq('id', job.payload.petId).maybeSingle();
    if (error) throw error;
    if (pet && pet.embedding_revision === job.payload.revision && pet.embedding_photo_url) {
      const path = ownedPetPhotoStoragePath(pet.embedding_photo_url, pet.created_by, process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (!path) throw new Error('Invalid stored image path');
      const bucket = admin.storage.from('pet-photos');
      const info = await bucket.info(path);
      if (info.error) throw info.error;
      if (!info.data.size || info.data.size > MAX_PHOTO_BYTES) throw new Error('Stored image exceeds processing limit');
      const photo = await bucket.download(path, {}, { signal: AbortSignal.timeout(10_000) });
      if (photo.error) throw photo.error;
      if (!photo.data.size || photo.data.size > MAX_PHOTO_BYTES) throw new Error('Invalid stored image size');
      const { embedStoredImage } = await import('./serverImageEmbedding');
      const embedding = await embedStoredImage(photo.data);
      const hash = createHash('sha256').update(Buffer.from(await photo.data.arrayBuffer())).digest('hex');
      const completed = await admin.rpc('complete_pet_image_embedding', {
        target_job: job.id, target_lease: job.lease_token, target_embedding: embedding, target_hash: hash,
      });
      if (completed.error) throw completed.error;
      // A false result means the photo changed or the lease expired. Finish is fenced below.
    }
  } catch {
    outcome = 'retry';
    reportError(new Error('Stored pet image processing failed'), { area: 'backend', operation: 'pet-image-embedding' });
  }
  const finished = await admin.rpc('finish_background_job', {
    target_id: job.id, target_lease: job.lease_token, outcome, next_cursor: null,
  });
  if (finished.error) throw finished.error;
  if (!finished.data) throw new Error('Pet image job lease lost');
  return true;
}

export function schedulePetImageJob(): void {
  after(async () => {
    try {
      if (await limitServiceRequest('pet-image-worker')) return;
      const deadline = Date.now() + 40_000;
      for (let count = 0; count < 3 && Date.now() < deadline; count += 1) {
        if (!await runPetImageJob()) break;
      }
    } catch {
      reportError(new Error('Pet image worker failed'), { area: 'backend', operation: 'pet-image-worker' });
    }
  });
}
