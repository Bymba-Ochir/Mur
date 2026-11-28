// lib/petService.ts
// Алдсан/олдсон амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { listingPhone } from './listingContact';
import { cosineSimilarityScore } from './similarity';
import { MIN_LISTING_PHOTO_SIMILARITY } from './imageEmbedding';
import { mapPetRow } from './petMapping';
import type { Pet, PetStatus, PetFilters, PetReportInput, UpdatePetFields } from './types';
import { cleanText, optionalCoordinate, optionalInteger } from './inputValidation';
import { apiError, authenticatedFetch } from './apiClient';
import { createIdempotencyKey, idempotentFileName, isIdempotencyKey } from './idempotency';
import { hydrateListingPhotos } from './photoRepository';
import { DISTRICTS } from './districts';
import { DEFAULT_PAGE_SIZE, finalizePage, pageWindow } from './pagination';

const TABLE = 'pets';
const BUCKET = 'pet-photos';
const PET_SEARCH_FIELDS = ['name', 'breed', 'color', 'place', 'type'] as const;
const LEGACY_HYBRID_CANDIDATE_LIMIT = 50;

function petSearchTerm(search?: string) {
  return search?.trim().replace(/[%_]/g, '') ?? '';
}

/**
 * Зураг Storage bucket-д хуулаад, public URL буцаана (зөвхөн дотор ашиглана)
 */
async function uploadPetPhoto(file: File, statusFolder: PetStatus, userId: string, mutationId: string, index: number): Promise<string> {
  const path = `${userId}/${statusFolder}/${idempotentFileName(mutationId, index, file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error && !/already exists|duplicate|resource already exists/i.test(error.message)) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Шинэ алдсан/олдсон амьтны бүртгэл нэмэх
 * @param data - { status, name, type, color, place, district, phone, photoFile, lat, lng }
 * @param onProgress - зураг хадгалах үеийн статус мессеж дамжуулах callback
 */
export async function createPetReport(
  data: PetReportInput,
  onProgress?: (message: string) => void,
  mutationId = createIdempotencyKey(),
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү.');
  if (!isIdempotencyKey(mutationId)) throw new Error('Үйлдлийн дугаар буруу байна.');
  if (!DISTRICTS.includes(data.district)) throw new Error('Дүүргээ сонгоно уу.');

  const phone = listingPhone(data.phone, data.phoneHidden);
  const reward = data.hasReward
    ? optionalInteger(data.reward, { min: 0, max: 100_000_000, label: 'Шагналын дүн' })
    : null;
  const payload = {
    status: data.status,
    name: cleanText(data.name, 100, 'Нэр'),
    type: data.type,
    breed: cleanText(data.breed, 100, 'Үүлдэр'),
    color: cleanText(data.color, 100, 'Онцгой шинж тэмдэг', true),
    place: cleanText(data.place, 300, 'Байршил', true),
    district: data.district,
    phone,
    phone_hidden: data.phoneHidden ?? false,
    has_reward: data.hasReward ?? false,
    reward,
    lat: optionalCoordinate(data.lat, 'lat'),
    lng: optionalCoordinate(data.lng, 'lng'),
  };

  const files = (data.photoFiles?.length ? data.photoFiles : data.photoFile ? [data.photoFile] : []).slice(0, 4);
  if (files.length) onProgress?.(`1/${files.length} зураг хадгалж байна...`);
  const photoUrls = await Promise.all(files.map((file, index) => uploadPetPhoto(file, data.status, user.id, mutationId, index)));
  const { data: petId, error } = await supabase.rpc('publish_pet_report', {
    target_id: mutationId,
    report: payload,
    target_urls: photoUrls,
  });
  if (error) {
    if (error.message && error.message.includes('RATE_LIMIT:')) {
      throw new Error('Хэт олон удаа мэдээлэл илгээлээ. 1 цагийн дараа дахин оролдоно уу.');
    }
    throw error;
  }

  if (photoUrls.length) {
    // The scheduler also processes the image job if the wake-up request fails.
    void authenticatedFetch(`/api/pets/${encodeURIComponent(petId)}/image-processing`, { method: 'POST' }).catch(() => {});
  }
  return petId;
}

/**
 * Тухайн ганц бичлэгийг ID-аар нь татах (share/дэлгэрэнгүй хуудсанд ашиглана)
 */
export async function fetchPetById(id: string): Promise<Pet> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  const [row] = await hydrateListingPhotos('pet', [data]);
  return mapPetRow(row);
}

/**
 * Жагсаалт татах — статус, дүүргээр шүүх, текстээр хайх боломжтой.
 * Анхдагчаар "Олдлоо" гэж хаагдсан (resolved=true) бичлэгийг харуулахгүй.
 */
export async function fetchPets(filters: PetFilters = {}): Promise<{ pets: Pet[]; hasMore: boolean }> {
  const { status, district, type, search, includeResolved = false, page = 0 } = filters;
  let q = supabase.from(TABLE).select('*').eq('is_hidden', false).is('archived_at', null).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (district) q = q.eq('district', district);
  if (type) q = q.eq('type', type);
  if (!includeResolved) q = q.eq('resolved', false);
  const term = petSearchTerm(search);
  if (term) q = q.or(PET_SEARCH_FIELDS.map(field => `${field}.ilike.%${term}%`).join(','));

  const window = pageWindow(page, DEFAULT_PAGE_SIZE);
  q = q.range(window.from, window.to);

  const { data, error } = await q;
  if (error) throw error;

  const result = finalizePage(data, window.page, window.pageSize);
  const hydrated = await hydrateListingPhotos('pet', result.items);

  return {
    pets: hydrated.map(mapPetRow),
    hasMore: result.hasMore,
  };
}

/**
 * Зохиогч өөрийн бичлэгийг засах (текст талбарууд) — зураг, embedding-д хамаарахгүй.
 * RLS "Owner can update own pet" дүрмээр зөвхөн зохиогч хийж чадна.
 */
export async function updatePet(id: string, fields: UpdatePetFields): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      name: fields.name === undefined ? undefined : cleanText(fields.name, 100, 'Нэр'),
      color: fields.color === undefined ? undefined : cleanText(fields.color, 100, 'Онцгой шинж тэмдэг', true),
      place: fields.place === undefined ? undefined : cleanText(fields.place, 300, 'Байршил', true),
      district: fields.district ?? undefined,
      phone: fields.phone === undefined ? undefined : listingPhone(fields.phone, fields.phoneHidden),
      phone_hidden: fields.phoneHidden,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePet(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/content/pets/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw await apiError(response);
}

/**
 * Амьтныг "Олдлоо" гэж тэмдэглэнэ — зөвхөн зохиогч (created_by) л хийж чадна,
 * бусад хэрэглэгчийн оролдлого RLS дүрмээр автоматаар цуцлагдана.
 */
export async function markResolved(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ resolved: true }).eq('id', id);
  if (error) throw error;
}

/**
 * Буруу/spam/hoax бичлэгийг мэдээлэх
 */
export async function reportPet(petId: string, reason: string): Promise<void> {
  const response = await authenticatedFetch('/api/reports', { method: 'POST', body: JSON.stringify({ petId, reason }) });
  if (!response.ok) throw await apiError(response);
}

/**
 * Тухайн зурагтай хамгийн төстэй бичлэгүүдийг DINOv2 embedding + cosine similarity-ээр эрэмбэлэх.
 * Хэмжээ (dimension) таарахгүй embedding-үүдийг (жишээ нь өмнөх өөр загвараар
 * тооцоолсон хуучин бичлэг) харьцуулалтгүйгээр жагсаалтаас хасна — эс тэгвээс
 * "0% төстэй" гэсэн буруу дүн гарна.
 */
export function rankBySimilarity(embeddings: number[][], pets: Pet[]): Pet[] {
  if (!embeddings.length) return pets;
  return pets
    .filter((pet) => Array.isArray(pet.embedding) && embeddings.some(vector => vector.length === pet.embedding?.length))
    .map((pet) => ({
      ...pet,
      similarity: Math.max(...embeddings.map(vector => cosineSimilarityScore(vector, pet.embedding))),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

export async function fetchPetCoverCandidates(fingerprint: string, filters: PetFilters, signal: AbortSignal): Promise<Pet[]> {
  const { data, error } = await supabase.rpc('match_pet_cover_ids', {
    query_fingerprint: fingerprint,
    query_status: filters.status || null,
    query_type: filters.type || null,
    query_district: filters.district || null,
    query_text: petSearchTerm(filters.search) || null,
  }).abortSignal(signal);
  if (error) throw error;
  const ids = ((data ?? []) as { id: string }[]).map(row => row.id);
  if (!ids.length || signal.aborted) return [];
  const { data: rows, error: rowsError } = await supabase.from(TABLE).select('*').in('id', ids)
    .eq('resolved', false).eq('is_hidden', false).is('archived_at', null).abortSignal(signal);
  if (rowsError) throw rowsError;
  const pets = (await hydrateListingPhotos('pet', rows ?? [])).map(mapPetRow);
  const byId = new Map(pets.map(pet => [pet.id, pet]));
  return ids.flatMap(id => byId.get(id) ?? []);
}

/**
 * pgvector RPC ашиглан бүх идэвхтэй зараас hybrid тохирол хайна.
 * Migration ажиллаагүй бол null буцааж UI хуучин browser fallback ашиглана.
 */
export async function fetchPetMatches({
  embeddings, imageHash, status, type, breed, color, district, search, lat, lng, limit = 20, signal,
}: {
  embeddings: number[][];
  imageHash?: string;
  status?: PetStatus;
  type?: Pet['type'];
  breed?: string;
  color?: string;
  district?: Pet['district'];
  search?: string;
  lat?: number;
  lng?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<Pet[] | null> {
  const term = petSearchTerm(search).toLowerCase();
  const hasListingFilters = Boolean(term || district);
  const filters = {
    // The RPC excludes the status supplied by a source listing.
    query_status: status ? (status === 'lost' ? 'found' : 'lost') : null,
    query_type: type ?? null,
    query_breed: breed || null,
    query_color: color || null,
    query_district: district ?? null,
    query_lat: lat ?? null,
    query_lng: lng ?? null,
    match_count: limit,
    min_image_similarity: MIN_LISTING_PHOTO_SIMILARITY / 100,
  };
  const results = await Promise.all(embeddings.map(async (embedding, index) => {
    const args = {
      ...filters,
      query_embedding: embedding,
      query_image_hash: index === 0 ? imageHash || null : null,
    };
    if (hasListingFilters) {
      const query = supabase.rpc('match_listing_pets_hybrid', { ...args, query_text: term || null });
      const result = await (signal ? query.abortSignal(signal) : query);
      // During rollout an older database can still serve the legacy candidates.
      if (result.error?.code !== 'PGRST202' || signal?.aborted) return result;
    }
    const query = supabase.rpc('match_pets_hybrid', {
      ...args,
      match_count: hasListingFilters ? LEGACY_HYBRID_CANDIDATE_LIMIT : limit,
    });
    return signal ? query.abortSignal(signal) : query;
  }));

  type MatchRow = {
    pet: Record<string, unknown> & { id: string; created_at: string };
    image_similarity: number;
    hybrid_score: number;
  };
  const bestById = new Map<string, MatchRow>();
  for (const { data, error } of results) {
    if (error) {
      if (/function .*match_pets_hybrid|schema cache|image_embedding/i.test(error.message)) return null;
      throw error;
    }
    for (const row of (data ?? []) as MatchRow[]) {
      if (row.pet.is_hidden === true || row.pet.archived_at != null) continue;
      if (district && row.pet.district !== district) continue;
      if (term && !PET_SEARCH_FIELDS.some(field => String(row.pet[field] ?? '').toLowerCase().includes(term))) continue;
      const current = bestById.get(row.pet.id);
      if (!current || row.hybrid_score > current.hybrid_score
        || (row.hybrid_score === current.hybrid_score && row.image_similarity > current.image_similarity)) {
        bestById.set(row.pet.id, row);
      }
    }
  }

  const rankedRows = [...bestById.values()]
    .sort((a, b) => b.hybrid_score - a.hybrid_score || b.pet.created_at.localeCompare(a.pet.created_at))
    .slice(0, limit);
  if (signal?.aborted) return [];
  const hydratedPets = await hydrateListingPhotos('pet', rankedRows.map((row) => row.pet));
  const petById = new Map(hydratedPets.map((pet) => [pet.id, pet]));
  return rankedRows.map((row) => ({
    ...mapPetRow((petById.get(row.pet.id) ?? row.pet) as never),
    similarity: Math.round(Number(row.image_similarity) * 100),
  }));
}
