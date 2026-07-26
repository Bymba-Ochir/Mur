// lib/petService.js
// Алдсан/олдсон амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { getImageColorSignature } from './similarity';

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
 */
export async function createPetReport(data) {
  let photoUrl = null;
  let colorSignature = null;

  if (data.photoFile) {
    photoUrl = await uploadPetPhoto(data.photoFile, data.status);
    // MVP: CLIP embedding-ийн оронд өнгөний histogram ашиглана (Үе шат 2-т CLIP-ээр солино)
    colorSignature = await getImageColorSignature(data.photoFile);
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
      color_signature: colorSignature, // [r,g,b] дундаж — энгийн төстэй байдал тооцоход ашиглана
    })
    .select()
    .single();

  if (error) throw error;
  return inserted.id;
}

/**
 * Жагсаалт татах — статус, дүүргээр шүүх боломжтой
 */
export async function fetchPets({ status, district } = {}) {
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (district) q = q.eq('district', district);

  const { data, error } = await q;
  if (error) throw error;

  // Frontend-ийн бусад код camelCase хүлээж байгаа тул хөрвүүлнэ
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
    colorSignature: p.color_signature,
    createdAt: p.created_at,
  }));
}

/**
 * Тухайн зурагтай хамгийн төстэй бичлэгүүдийг эрэмбэлэх (MVP-ийн энгийн similarity)
 * Үе шат 2-т үүнийг CLIP embedding + cosine similarity-ээр солино.
 */
export function rankBySimilarity(targetSignature, pets) {
  if (!targetSignature) return pets;
  return [...pets]
    .filter((p) => p.colorSignature)
    .map((p) => ({
      ...p,
      similarity: colorDistanceToScore(targetSignature, p.colorSignature),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

function colorDistanceToScore(a, b) {
  const dist = Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
  return Math.max(0, Math.min(100, Math.round(100 - dist / 2.2)));
}
