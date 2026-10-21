import type { SupabaseClient } from '@supabase/supabase-js';
import { isMissingNormalizedTable, legacyPhotoUrls, type ListingPhotoKind, type LegacyPhotoRow } from './photoModel';

const PHOTO_CONFIG: Record<ListingPhotoKind, { table: string; foreignKey: string; ownerTable: string }> = {
  pet: { table: 'pet_photos', foreignKey: 'pet_id', ownerTable: 'pets' },
  adoption: { table: 'adoption_photos', foreignKey: 'adoption_id', ownerTable: 'adoptions' },
};

type PhotoRow = { url?: unknown; position?: unknown };

function orderedUrls(rows: PhotoRow[]): string[] {
  return [...rows]
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((row) => row.url)
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .slice(0, 4);
}

async function fetchLegacyPhotoRows(
  client: SupabaseClient,
  ownerTable: string,
  ownerIds: string[],
): Promise<Array<LegacyPhotoRow & { id: string }>> {
  if (ownerIds.length === 0) return [];
  const fullResult = await client.from(ownerTable).select('id,photo_url,photo_urls').in('id', ownerIds);
  if (!fullResult.error) {
    return (fullResult.data ?? []) as Array<LegacyPhotoRow & { id: string }>;
  }
  if (!isMissingNormalizedTable(fullResult.error)) throw fullResult.error;

  const primaryResult = await client.from(ownerTable).select('id,photo_url').in('id', ownerIds);
  if (primaryResult.error) throw primaryResult.error;
  return (primaryResult.data ?? []) as Array<LegacyPhotoRow & { id: string }>;
}

/** Server-side photo lookup that remains compatible before and after v96. */
export async function fetchServerListingPhotoUrls(
  client: SupabaseClient,
  kind: ListingPhotoKind,
  ownerId: string,
): Promise<string[]> {
  const { table, foreignKey, ownerTable } = PHOTO_CONFIG[kind];
  const result = await client.from(table).select('url,position').eq(foreignKey, ownerId).order('position', { ascending: true });
  if (!result.error) return orderedUrls((result.data ?? []) as PhotoRow[]);
  if (!isMissingNormalizedTable(result.error)) throw result.error;

  const rows = await fetchLegacyPhotoRows(client, ownerTable, [ownerId]);
  return rows.length ? legacyPhotoUrls(rows[0]) : [];
}

/** Batch variant used by account cleanup/export paths. */
export async function fetchServerPhotoUrlsForOwners(
  client: SupabaseClient,
  kind: ListingPhotoKind,
  ownerIds: string[],
): Promise<string[]> {
  if (ownerIds.length === 0) return [];
  const { ownerTable } = PHOTO_CONFIG[kind];
  const result = kind === 'pet'
    ? await client.from('pet_photos').select('pet_id,url,position').in('pet_id', ownerIds)
    : await client.from('adoption_photos').select('adoption_id,url,position').in('adoption_id', ownerIds);
  if (!result.error) {
    return (result.data ?? [])
      .map((row) => (row as unknown as PhotoRow).url)
      .filter((url): url is string => typeof url === 'string' && url.length > 0);
  }
  if (!isMissingNormalizedTable(result.error)) throw result.error;

  const rows = await fetchLegacyPhotoRows(client, ownerTable, ownerIds);
  return rows.flatMap(legacyPhotoUrls);
}

/** Export normalized child rows without breaking pre-v96 deployments. */
export async function fetchServerPhotoRecords(
  client: SupabaseClient,
  kind: ListingPhotoKind,
  ownerIds: string[],
): Promise<Array<Record<string, unknown>>> {
  if (ownerIds.length === 0) return [];
  const { foreignKey } = PHOTO_CONFIG[kind];
  const result = kind === 'pet'
    ? await client
        .from('pet_photos')
        .select('id,pet_id,url,position,created_at')
        .in('pet_id', ownerIds)
        .order('position', { ascending: true })
    : await client
        .from('adoption_photos')
        .select('id,adoption_id,url,position,created_at')
        .in('adoption_id', ownerIds)
        .order('position', { ascending: true });
  if (!result.error) return (result.data ?? []) as unknown as Array<Record<string, unknown>>;
  if (!isMissingNormalizedTable(result.error)) throw result.error;

  const legacyRows = await fetchLegacyPhotoRows(client, PHOTO_CONFIG[kind].ownerTable, ownerIds);
  return legacyRows.flatMap((row) => legacyPhotoUrls(row).map((url, position) => ({
    [foreignKey]: row.id,
    url,
    position,
  })));
}
