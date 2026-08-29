export function petPhotoStoragePath(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  try {
    const marker = '/storage/v1/object/public/pet-photos/';
    const path = new URL(url).pathname;
    const index = path.indexOf(marker);
    return index < 0 ? null : decodeURIComponent(path.slice(index + marker.length));
  } catch { return null; }
}
