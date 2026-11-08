import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { createAdminClient } from './supabaseAdmin';
import { InputValidationError } from './inputValidation';
import { JSON_BODY_LIMIT, JsonBodyError, parseJsonRecord, readBoundedBody, readJsonBody } from './requestJson';
import { GUEST_SIGHTING_PHOTO_BUCKET, SIGHTING_PHOTO_BUCKET, SIGHTING_PHOTO_LIMIT, SIGHTING_PHOTO_TYPES } from './sightingPhoto';

type SightingPhoto = { bytes: Buffer; digest: string };

export async function readSightingSubmission(request: Request, requireJsonContentType = false): Promise<{
  body: Record<string, unknown>;
  photo: SightingPhoto | null;
}> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.split(';')[0].trim().toLowerCase() !== 'multipart/form-data') {
    return { body: await readJsonBody(request, { requireJsonContentType }), photo: null };
  }

  const bytes = await readBoundedBody(request, SIGHTING_PHOTO_LIMIT + 2 * JSON_BODY_LIMIT);
  const form = await new Response(bytes, { headers: { 'content-type': contentType } })
    .formData().catch(() => { throw new JsonBodyError(400); });
  const details = form.get('details');
  const file = form.get('photo');
  if (typeof details !== 'string' || form.getAll('details').length !== 1 || form.getAll('photo').length !== 1 || !(file instanceof File)) {
    throw new JsonBodyError(400);
  }
  if (Buffer.byteLength(details) > JSON_BODY_LIMIT || file.size > SIGHTING_PHOTO_LIMIT) throw new JsonBodyError(413);
  if (!file.size || !SIGHTING_PHOTO_TYPES.some(type => type === file.type)) {
    throw new InputValidationError('JPG, PNG эсвэл WebP зураг сонгоно уу.');
  }

  const photoBytes = Buffer.from(await file.arrayBuffer());
  return {
    body: parseJsonRecord(details),
    photo: { bytes: photoBytes, digest: createHash('sha256').update(photoBytes).digest('hex') },
  };
}

async function normalizePhoto(bytes: Buffer) {
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error('Unsupported image');
    return await image.rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
  } catch {
    throw new InputValidationError('Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.');
  }
}

export async function uploadSightingPhoto(
  admin: ReturnType<typeof createAdminClient>, sightingId: string, photo: SightingPhoto,
  bucket: typeof SIGHTING_PHOTO_BUCKET | typeof GUEST_SIGHTING_PHOTO_BUCKET = SIGHTING_PHOTO_BUCKET,
) {
  const jpeg = await normalizePhoto(photo.bytes);
  const uploadId = randomUUID();
  const path = `${sightingId}/${uploadId}/${photo.digest}.jpg`;

  // A delayed job handles crashes and concurrent retries. Each attempt owns
  // a separate object, and the worker keeps the one referenced by the sighting.
  const { error: cleanupError } = await admin.from('background_jobs').insert({
    kind: 'storage-cleanup',
    dedupe_key: `sighting-upload:${uploadId}`,
    available_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    payload: bucket === GUEST_SIGHTING_PHOTO_BUCKET ? { guestSightingPhotoPath: path } : { sightingPhotoPath: path },
  });
  if (cleanupError) throw cleanupError;

  const { error } = await admin.storage.from(bucket).upload(path, jpeg, {
    contentType: 'image/jpeg',
    cacheControl: '300',
    upsert: false,
  });
  if (error) throw error;
  return path;
}
