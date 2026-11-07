export const SIGHTING_PHOTO_BUCKET = 'sighting-photos';
export const SIGHTING_PHOTO_LIMIT = 3 * 1024 * 1024;
export const SIGHTING_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const UUID = '[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}';
const PHOTO_PATH = new RegExp(`^(${UUID})/${UUID}/[0-9a-f]{64}\\.jpg$`);

export function sightingPhotoPathParts(value: unknown) {
  const match = typeof value === 'string' ? PHOTO_PATH.exec(value) : null;
  return match ? { sightingId: match[1] } : null;
}

export function sightingPhotoUrl(path: unknown) {
  const project = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return project && typeof path === 'string' && sightingPhotoPathParts(path)
    ? `${project.replace(/\/$/, '')}/storage/v1/object/public/${SIGHTING_PHOTO_BUCKET}/${path}`
    : null;
}
