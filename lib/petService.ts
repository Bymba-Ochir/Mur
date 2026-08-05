// lib/petService.ts
// Алдсан/олдсон амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { getImageEmbedding, cosineSimilarityScore } from './similarity';
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

  if (data.photoFile) {
    photoUrl = await uploadPetPhoto(data.photoFile, data.status);
    try {
      embedding = await getImageEmbedding(data.photoFile, onProgress);
    } catch (err) {
      // Embedding амжилтгүй бол ч мэдэгдлийг нийтлэхэд саад болгохгүй —
      // зөвхөн "төстэй байдал" функц тухайн бичлэгт ажиллахгүй болно
      console.warn('Embedding алдаа:', err instanceof Error ? err.message : err);
    }
  }

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert({
      status: data.status, // 'lost' | 'found'
      name: data.name || '',
      type: data.type, // 'Нохой' | 'Муур' | 'Бусад'
      color: data.color || '',
      place: data.place || '',
      district: data.district || '',
      phone: data.phone || '',
      has_reward: data.hasReward ?? false,
      reward: data.reward ?? null,
      photo_url: photoUrl,
      color_signature: embedding, // багана нэрээ хуучнаар үлдээсэн, одоо CLIP vector хадгална
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    })
    .select()
    .single();

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
    q = q.or(`name.ilike.%${s}%,color.ilike.%${s}%,place.ilike.%${s}%,type.ilike.%${s}%`);
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
 * Тухайн зурагтай хамгийн төстэй бичлэгүүдийг CLIP embedding + cosine similarity-ээр эрэмбэлэх.
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
