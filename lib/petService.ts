// lib/petService.ts
// Алдсан/олдсон амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { getImageEmbedding, getImageHash, cosineSimilarityScore, EMBEDDING_VERSION } from './similarity';
import { mapPetRow } from './petMapping';
import type { Pet, PetStatus, PetFilters, PetReportInput, UpdatePetFields } from './types';

const TABLE = 'pets';
const BUCKET = 'pet-photos';

/**
 * Зураг Storage bucket-д хуулаад, public URL буцаана (зөвхөн дотор ашиглана)
 */
async function uploadPetPhoto(file: File, statusFolder: PetStatus): Promise<string> {
  const path = `${statusFolder}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Шинэ алдсан/олдсон амьтны бүртгэл нэмэх
 * @param data - { status, name, type, color, place, district, phone, photoFile, lat, lng }
 * @param onProgress - embedding тооцоолж байх үеийн статус мессеж дамжуулах callback
 */
export async function createPetReport(data: PetReportInput, onProgress?: (message: string) => void): Promise<string> {
  let photoUrl: string | null = null;
  let embedding: number[] | null = null;
  let imageHash: string | null = null;

  if (data.photoFile) {
    photoUrl = await uploadPetPhoto(data.photoFile, data.status);
    try {
      [embedding, imageHash] = await Promise.all([
        getImageEmbedding(data.photoFile, onProgress),
        getImageHash(data.photoFile),
      ]);
    } catch (err) {
      // Embedding амжилтгүй бол ч мэдэгдлийг нийтлэхэд саад болгохгүй —
      // зөвхөн "төстэй байдал" функц тухайн бичлэгт ажиллахгүй болно
      console.warn('Embedding алдаа:', err instanceof Error ? err.message : err);
    }
  }

  const payload = {
      status: data.status, // 'lost' | 'found'
      name: data.name || '',
      type: data.type, // 'Нохой' | 'Муур' | 'Бусад'
      breed: data.breed || '',
      color: data.color || '',
      place: data.place || '',
      district: data.district || '',
      phone: data.phone || '',
      has_reward: data.hasReward ?? false,
      reward: data.reward ?? null,
      photo_url: photoUrl,
      color_signature: embedding, // browser fallback-д DINOv2 vector-ийг JSONB хэлбэрээр хадгална
      dino_embedding: embedding,
      embedding_version: embedding ? EMBEDDING_VERSION : null,
      image_hash: imageHash,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
  };

  let result = await supabase.from(TABLE).insert(payload).select().single();

  // Migration хараахан ажиллаагүй deployment дээр зар нийтлэхийг эвдэхгүй.
  if (result.error && /image_embedding|dino_embedding|embedding_version|image_hash|schema cache/i.test(result.error.message)) {
    const { dino_embedding: _dino, embedding_version: _version, image_hash: _hash, ...legacyPayload } = payload;
    result = await supabase.from(TABLE).insert(legacyPayload).select().single();
  }

  const { data: inserted, error } = result;

  if (error) {
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
      name: fields.name ?? undefined,
      color: fields.color ?? undefined,
      place: fields.place ?? undefined,
      district: fields.district ?? undefined,
      phone: fields.phone ?? undefined,
    })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Зохиогч өөрийн бичлэгийг устгах. Storage дахь зургийг цэвэрлэхгүй
 * (MVP-д хялбар байдлаар орхигдсон, дараа нь cleanup job нэмж болно).
 */
export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
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
  const { error } = await supabase.from('reports').insert({ pet_id: petId, reason });
  if (error) throw error;
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
