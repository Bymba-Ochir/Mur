export type ListingPhotoKind = 'pet' | 'adoption';

export type LegacyPhotoRow = {
  photo_url?: string | null;
  photo_urls?: unknown;
};

export function isMissingNormalizedTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(error.code ?? '')
    || /schema cache|does not exist|could not find/i.test(error.message ?? '');
}

export function legacyPhotoUrls(row: LegacyPhotoRow): string[] {
  if (Array.isArray(row.photo_urls)) {
    const urls = row.photo_urls.filter((url): url is string => typeof url === 'string' && url.length > 0);
    if (urls.length) return urls.slice(0, 4);
  }
  return row.photo_url ? [row.photo_url] : [];
}
