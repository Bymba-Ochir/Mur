// lib/petService.js
// Алдсан/олдсон амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { getImageEmbedding, cosineSimilarityScore } from './similarity';

const TABLE = 'pets';
const BUCKET = 'pet-photos';

/**
 * Зураг Storage bucket-д хуулаад, public URL буцаана
 */
export async function uploadPetPhoto(file, statusFolder) {
  const path = `${statusFolder}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Шинэ алдсан/олдсон амьтны бүртгэл нэмэх
 * @param {object} data - { status, name, type, color, place, district, phone, photoFile }
 * @param {function} [onProgress] - embedding тооцоолж байх үеийн статус мессеж дамжуулах callback
 */
export async function createPetReport(data, onProgress) {
  let photoUrl = null;
  let embedding = null;

  if (data.photoFile) {
    photoUrl = await uploadPetPhoto(data.photoFile, data.status);
    try {
      embedding = await getImageEmbedding(data.photoFile, onProgress);
    } catch (err) {
      // Embedding амжилтгүй бол ч мэдэгдлийг нийтлэхэд саад болгохгүй —
      // зөвхөн "төстэй байдал" функц тухайн бичлэгт ажиллахгүй болно
      console.warn('Embedding алдаа:', err.message);
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
export async function fetchPetById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return {
    id: data.id,
    status: data.status,
    name: data.name,
    type: data.type,
    color: data.color,
    place: data.place,
    district: data.district,
    phone: data.phone,
    photoURL: data.photo_url,
    embedding: data.color_signature,
    lat: data.lat,
    lng: data.lng,
    resolved: data.resolved,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

/**
 * Жагсаалт татах — статус, дүүргээр шүүх, текстээр хайх боломжтой.
 * Анхдагчаар "Олдлоо" гэж хаагдсан (resolved=true) бичлэгийг харуулахгүй.
 */
export async function fetchPets({ status, district, search, includeResolved = false } = {}) {
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (district) q = q.eq('district', district);
  if (!includeResolved) q = q.eq('resolved', false);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%_]/g, '');
    q = q.or(`name.ilike.%${s}%,color.ilike.%${s}%,place.ilike.%${s}%,type.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  return data.map((p) => ({
    id: p.id,
    status: p.status,
    name: p.name,
    type: p.type,
    color: p.color,
    place: p.place,
    district: p.district,
    phone: p.phone,
    photoURL: p.photo_url,
    embedding: p.color_signature,
    lat: p.lat,
    lng: p.lng,
    resolved: p.resolved,
    createdBy: p.created_by,
    createdAt: p.created_at,
  }));
}

/**
 * Зохиогч өөрийн бичлэгийг засах (текст талбарууд) — зураг, embedding-д хамаарахгүй.
 * RLS "Owner can update own pet" дүрмээр зөвхөн зохиогч хийж чадна.
 */
export async function updatePet(id, fields) {
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
export async function deletePet(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/**
 * Амьтныг "Олдлоо" гэж тэмдэглэнэ — зөвхөн зохиогч (created_by) л хийж чадна,
 * бусад хэрэглэгчийн оролдлого RLS дүрмээр автоматаар цуцлагдана.
 */
export async function markResolved(id) {
  const { error } = await supabase.from(TABLE).update({ resolved: true }).eq('id', id);
  if (error) throw error;
}

/**
 * Буруу/spam/hoax бичлэгийг мэдээлэх
 */
export async function reportPet(petId, reason) {
  const { error } = await supabase.from('reports').insert({ pet_id: petId, reason });
  if (error) throw error;
}

/**
 * Тухайн зурагтай хамгийн төстэй бичлэгүүдийг CLIP embedding + cosine similarity-ээр эрэмбэлэх.
 * Хэмжээ (dimension) таарахгүй embedding-үүдийг (жишээ нь өмнөх өөр загвараар
 * тооцоолсон хуучин бичлэг) харьцуулалтгүйгээр жагсаалтаас хасна — эс тэгвээс
 * "0% төстэй" гэсэн буруу дүн гарна.
 */
export function rankBySimilarity(targetEmbedding, pets) {
  if (!targetEmbedding) return pets;
  return [...pets]
    .filter((p) => Array.isArray(p.embedding) && p.embedding.length === targetEmbedding.length)
    .map((p) => ({
      ...p,
      similarity: cosineSimilarityScore(targetEmbedding, p.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}
