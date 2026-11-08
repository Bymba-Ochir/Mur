import type { createAdminClient } from './supabaseAdmin';
import { GUEST_SIGHTING_PHOTO_BUCKET, sightingPhotoPathParts } from './sightingPhoto';

export async function guestSightingPhotoResponse(admin: ReturnType<typeof createAdminClient>, path: unknown) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (typeof path !== 'string' || !sightingPhotoPathParts(path)) return new Response(null, { status: 404, headers });
  const { data, error } = await admin.storage.from(GUEST_SIGHTING_PHOTO_BUCKET).download(path);
  if (error) throw error;
  return new Response(data, {
    headers: { ...headers, 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff' },
  });
}
