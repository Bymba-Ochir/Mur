export function petPhotoStoragePath(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  try {
    const marker = '/storage/v1/object/public/pet-photos/';
    const path = new URL(url).pathname;
    const index = path.indexOf(marker);
    return index < 0 ? null : decodeURIComponent(path.slice(index + marker.length));
  } catch { return null; }
}

/** Only remove objects from this project and the content owner's folder. */
export function ownedPetPhotoStoragePath(url: unknown, ownerId: unknown, projectUrl: string | undefined): string | null {
  if (typeof url !== 'string' || typeof ownerId !== 'string' || !ownerId || !projectUrl) return null;
  try {
    const source = new URL(url);
    if (source.origin !== new URL(projectUrl).origin || source.username || source.password) return null;
    const path = petPhotoStoragePath(url);
    if (!path || !path.startsWith(ownerId + '/') || path.split('/').some(part => !part || part === '.' || part === '..') || path.includes('\\')) return null;
    return path;
  } catch { return null; }
}
