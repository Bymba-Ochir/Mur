import { supabase } from './supabase';
import { isMissingNormalizedTable, legacyPhotoUrls, type ListingPhotoKind, type LegacyPhotoRow } from './photoModel';

type ListingRow = {
  id: string;
};

export type HydratedListingPhotos = {
  photo_url: string | null;
  photo_urls: string[];
};

const PHOTO_CONFIG: Record<ListingPhotoKind, { table: string; foreignKey: string; ownerTable: string }> = {
  pet: { table: 'pet_photos', foreignKey: 'pet_id', ownerTable: 'pets' },
  adoption: { table: 'adoption_photos', foreignKey: 'adoption_id', ownerTable: 'adoptions' },
};

function withHydratedPhotos<T extends ListingRow>(rows: T[], byOwner: Map<string, string[]>): Array<T & HydratedListingPhotos> {
  return rows.map((row) => {
    const urls = (byOwner.get(row.id) ?? []).slice(0, 4);
    return {
      ...row,
      photo_url: urls[0] ?? null,
      photo_urls: urls,
    };
  });
}

async function fetchLegacyPhotos(
  ownerTable: string,
  ownerIds: string[],
): Promise<Map<string, string[]>> {
  let data: unknown[] | null = null;
  const fullResult = await supabase.from(ownerTable).select('id,photo_url,photo_urls').in('id', ownerIds);

  if (!fullResult.error) {
    data = fullResult.data;
  } else {
    if (!isMissingNormalizedTable(fullResult.error)) throw fullResult.error;
    const primaryResult = await supabase.from(ownerTable).select('id,photo_url').in('id', ownerIds);
    if (primaryResult.error) throw primaryResult.error;
    data = primaryResult.data;
  }

  const byOwner = new Map<string, string[]>();
  for (const raw of data ?? []) {
    const row = raw as unknown as LegacyPhotoRow & { id?: unknown };
    if (typeof row.id !== 'string') continue;
    byOwner.set(row.id, legacyPhotoUrls(row));
  }
  return byOwner;
}

/**
 * Hydrate DB rows with normalized photo children. During the rollout, a missing
 * child table fetches the legacy photo columns separately, so callers do not
 * have to select columns that are removed by the v96 migration.
 */
export async function hydrateListingPhotos<T extends ListingRow>(
  kind: ListingPhotoKind,
  rows: T[],
): Promise<Array<T & HydratedListingPhotos>> {
  if (rows.length === 0) return [];
  const { table, foreignKey, ownerTable } = PHOTO_CONFIG[kind];
  const ids = rows.map((row) => row.id);
  const { data, error } = await supabase
    .from(table)
    .select(`${foreignKey},url,position`)
    .in(foreignKey, ids)
    .order('position', { ascending: true });

  if (error) {
    if (!isMissingNormalizedTable(error)) throw error;
    return withHydratedPhotos(rows, await fetchLegacyPhotos(ownerTable, ids));
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

  return withHydratedPhotos(rows, byOwner);
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
