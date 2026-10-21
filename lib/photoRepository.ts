import { supabase } from './supabase';
import { isMissingNormalizedTable, type ListingPhotoKind } from './photoModel';

type ListingRow = {
  id: string;
  photo_url?: string | null;
  photo_urls?: unknown;
};

const PHOTO_CONFIG: Record<ListingPhotoKind, { table: string; foreignKey: string }> = {
  pet: { table: 'pet_photos', foreignKey: 'pet_id' },
  adoption: { table: 'adoption_photos', foreignKey: 'adoption_id' },
};

/**
 * Hydrate DB rows with normalized photo children. During the rollout, a missing
 * child table falls back to the old photo_url/photo_urls columns.
 */
export async function hydrateListingPhotos<T extends ListingRow>(kind: ListingPhotoKind, rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const { table, foreignKey } = PHOTO_CONFIG[kind];
  const ids = rows.map((row) => row.id);
  const { data, error } = await supabase
    .from(table)
    .select(`${foreignKey},url,position`)
    .in(foreignKey, ids)
    .order('position', { ascending: true });

  if (error) {
    if (isMissingNormalizedTable(error)) return rows;
    throw error;
  }

  const byOwner = new Map<string, string[]>();
  for (const raw of data ?? []) {
    const row = raw as unknown as Record<string, unknown>;
    const ownerId = row[foreignKey];
    const url = row.url;
    if (typeof ownerId !== 'string' || typeof url !== 'string') continue;
    const urls = byOwner.get(ownerId) ?? [];
    urls.push(url);
    byOwner.set(ownerId, urls);
  }

  return rows.map((row) => {
    const urls = (byOwner.get(row.id) ?? []).slice(0, 4);
    return {
      ...row,
      photo_url: urls[0] ?? null,
      photo_urls: urls,
    };
  });
}

/**
 * Save the canonical 1:N photo rows. Returns false only when the normalization
 * migration has not been applied yet, allowing callers to write the legacy
 * columns for a zero-downtime rollout.
 */
export async function saveListingPhotos(kind: ListingPhotoKind, ownerId: string, urls: string[]): Promise<boolean> {
  const { table, foreignKey } = PHOTO_CONFIG[kind];
  const normalizedUrls = [...new Set(urls.filter(Boolean))].slice(0, 4);

  if (normalizedUrls.length) {
    const rows = normalizedUrls.map((url, position) => ({ [foreignKey]: ownerId, url, position }));
    const { error } = await supabase.from(table).upsert(rows, { onConflict: `${foreignKey},position` });
    if (error) {
      if (isMissingNormalizedTable(error)) return false;
      throw error;
    }
  } else {
    const probe = await supabase.from(table).select(foreignKey).eq(foreignKey, ownerId).limit(1);
    if (probe.error) {
      if (isMissingNormalizedTable(probe.error)) return false;
      throw probe.error;
    }
  }

  const stale = await supabase.from(table).delete().eq(foreignKey, ownerId).gte('position', normalizedUrls.length);
  if (stale.error) {
    if (isMissingNormalizedTable(stale.error)) return false;
    throw stale.error;
  }
  return true;
}
