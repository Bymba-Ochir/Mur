// lib/petService.ts
// Алдсан/олдсон амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { getImageEmbedding, getImageHash, cosineSimilarityScore, EMBEDDING_VERSION } from './similarity';
import { mapPetRow } from './petMapping';
import type { Pet, PetStatus, PetFilters, PetReportInput, UpdatePetFields } from './types';
import { cleanText, optionalCoordinate, optionalInteger, requireMongolianPhone } from './inputValidation';
import { apiError, authenticatedFetch } from './apiClient';
import { createIdempotencyKey, idempotentFileName, isIdempotencyKey } from './idempotency';

const TABLE = 'pets';
const BUCKET = 'pet-photos';

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
 * @param onProgress - embedding тооцоолж байх үеийн статус мессеж дамжуулах callback
 */
export async function createPetReport(
  data: PetReportInput,
  onProgress?: (message: string) => void,
  mutationId = createIdempotencyKey(),
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү.');
  if (!isIdempotencyKey(mutationId)) throw new Error('Үйлдлийн дугаар буруу байна.');

  const { data: existing, error: existingError } = await supabase.from(TABLE).select('id,created_by').eq('id', mutationId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.created_by !== user.id) throw new Error('Үйлдлийн дугаар давхардлаа. Дахин оролдоно уу.');
    return existing.id;
  }

  const phone = requireMongolianPhone(data.phone);
  const reward = data.hasReward
    ? optionalInteger(data.reward, { min: 0, max: 100_000_000, label: 'Шагналын дүн' })
    : null;
  let photoUrl: string | null = null;
  let photoUrls: string[] = [];
  let embedding: number[] | null = null;
  let imageHash: string | null = null;

  const files = (data.photoFiles?.length ? data.photoFiles : data.photoFile ? [data.photoFile] : []).slice(0, 4);
  if (files.length) {
    onProgress?.(`1/${files.length} зураг хадгалж байна...`);
    photoUrls = await Promise.all(files.map((file, index) => uploadPetPhoto(file, data.status, user.id, mutationId, index)));
    photoUrl = photoUrls[0] ?? null;
    try {
      [embedding, imageHash] = await Promise.all([
        getImageEmbedding(files[0], onProgress),
        getImageHash(files[0]),
      ]);
    } catch (err) {
      // Embedding амжилтгүй бол ч мэдэгдлийг нийтлэхэд саад болгохгүй —
      // зөвхөн "төстэй байдал" функц тухайн бичлэгт ажиллахгүй болно
      console.warn('Embedding алдаа:', err instanceof Error ? err.message : err);
    }
  }

  const payload = {
      id: mutationId,
      created_by: user.id,
      status: data.status, // 'lost' | 'found'
      name: cleanText(data.name, 100, 'Нэр'),
      type: data.type, // 'Нохой' | 'Муур' | 'Бусад'
      breed: cleanText(data.breed, 100, 'Үүлдэр'),
      color: cleanText(data.color, 100, 'Өнгө', true),
      place: cleanText(data.place, 300, 'Байршил', true),
      district: data.district || '',
      phone,
      has_reward: data.hasReward ?? false,
      reward,
      photo_url: photoUrl,
      photo_urls: photoUrls,
      color_signature: embedding, // browser fallback-д DINOv2 vector-ийг JSONB хэлбэрээр хадгална
      dino_embedding: embedding,
      embedding_version: embedding ? EMBEDDING_VERSION : null,
      image_hash: imageHash,
      lat: optionalCoordinate(data.lat, 'lat'),
      lng: optionalCoordinate(data.lng, 'lng'),
  };

  let result = await supabase.from(TABLE).insert(payload).select().single();

  // Migration хараахан ажиллаагүй deployment дээр зар нийтлэхийг эвдэхгүй.
  if (result.error && /image_embedding|dino_embedding|embedding_version|image_hash|photo_urls|schema cache/i.test(result.error.message)) {
    const { dino_embedding: _dino, embedding_version: _version, image_hash: _hash, photo_urls: _photos, ...legacyPayload } = payload;
    result = await supabase.from(TABLE).insert(legacyPayload).select().single();
  }

  const { data: inserted, error } = result;

  if (error) {
    if (error.code === '23505') {
      const { data: raced, error: racedError } = await supabase.from(TABLE).select('id,created_by').eq('id', mutationId).maybeSingle();
      if (racedError) throw racedError;
      if (raced?.created_by === user.id) return raced.id;
    }
    if (error.message && error.message.includes('RATE_LIMIT:')) {
      throw new Error('Хэт олон удаа мэдээлэл илгээлээ. 1 цагийн дараа дахин оролдоно уу.');
    }
    throw error;
  }
  return inserted.id;
}

/**
 * Тухайн ганц бичлэгийг ID-аар нь татах (share/дэлгэрэнгүй хуудсанд ашиглана)
 */
export async function fetchPetById(id: string): Promise<Pet> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return mapPetRow(data);
}

/**
 * Жагсаалт татах — статус, дүүргээр шүүх, текстээр хайх боломжтой.
 * Анхдагчаар "Олдлоо" гэж хаагдсан (resolved=true) бичлэгийг харуулахгүй.
 */
const PAGE_SIZE = 24;

export async function fetchPets(filters: PetFilters = {}): Promise<{ pets: Pet[]; hasMore: boolean }> {
  const { status, district, type, search, includeResolved = false, page = 0 } = filters;
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (district) q = q.eq('district', district);
  if (type) q = q.eq('type', type);
  if (!includeResolved) q = q.eq('resolved', false);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%_]/g, '');
    q = q.or(`name.ilike.%${s}%,breed.ilike.%${s}%,color.ilike.%${s}%,place.ilike.%${s}%,type.ilike.%${s}%`);
  }

  // Дараагийн хуудас байгаа эсэхийг мэдэхийн тулд 1-ээр илүү бичлэг татна
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE; // PAGE_SIZE+1 ширхэг (0-based inclusive range)
  q = q.range(from, to);

  const { data, error } = await q;
  if (error) throw error;

  const hasMore = data.length > PAGE_SIZE;
  const pageData = hasMore ? data.slice(0, PAGE_SIZE) : data;

  return {
    pets: pageData.map(mapPetRow),
    hasMore,
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
      color: fields.color === undefined ? undefined : cleanText(fields.color, 100, 'Өнгө', true),
      place: fields.place === undefined ? undefined : cleanText(fields.place, 300, 'Байршил', true),
      district: fields.district ?? undefined,
      phone: fields.phone === undefined ? undefined : requireMongolianPhone(fields.phone),
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
export function rankBySimilarity(targetEmbedding: number[] | null, pets: Pet[]): Pet[] {
  if (!targetEmbedding) return pets;
  return [...pets]
    .filter((p) => Array.isArray(p.embedding) && p.embedding.length === targetEmbedding.length)
    .map((p) => ({
      ...p,
      similarity: cosineSimilarityScore(targetEmbedding, p.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * pgvector RPC ашиглан бүх идэвхтэй зараас hybrid тохирол хайна.
 * Migration ажиллаагүй бол null буцааж UI хуучин browser fallback ашиглана.
 */
export async function fetchPetMatches({
  embedding, imageHash, status, type, breed, color, district, lat, lng, limit = 20,
}: {
  embedding: number[];
  imageHash?: string;
  status?: PetStatus;
  type?: Pet['type'];
  breed?: string;
  color?: string;
  district?: Pet['district'];
  lat?: number;
  lng?: number;
  limit?: number;
}): Promise<Pet[] | null> {
  const { data, error } = await supabase.rpc('match_pets_hybrid', {
    query_embedding: embedding,
    query_image_hash: imageHash || null,
    query_status: status ?? null,
    query_type: type ?? null,
    query_breed: breed || null,
    query_color: color || null,
    query_district: district ?? null,
    query_lat: lat ?? null,
    query_lng: lng ?? null,
    match_count: limit,
    min_image_similarity: 0.15,
  });

  if (error) {
    if (/function .*match_pets_hybrid|schema cache|image_embedding/i.test(error.message)) return null;
    throw error;
  }

  return (data ?? []).map((row: { pet: Record<string, unknown>; image_similarity: number; hybrid_score: number }) => ({
    ...mapPetRow(row.pet as never),
    similarity: Math.round(Number(row.image_similarity) * 100),
    hybridScore: Math.round(Number(row.hybrid_score)),
  }));
}
