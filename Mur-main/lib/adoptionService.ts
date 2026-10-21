import { validatePetAge } from './petAge';
// lib/adoptionService.ts
// Үрчлүүлэх амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { mapAdoptionRow } from './adoptionMapping';
import type { Adoption, AdoptionInput, AdoptionFilters, UpdateAdoptionFields } from './types';
import { cleanText, requireMongolianPhone } from './inputValidation';
import { apiError, authenticatedFetch } from './apiClient';

const TABLE = 'adoptions';
const BUCKET = 'pet-photos';
const PAGE_SIZE = 24;

/**
 * Зураг Storage bucket-д хуулаад, public URL буцаана
 */
async function uploadAdoptionPhoto(file: File, userId: string): Promise<string> {
  const path = `${userId}/adoptions/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Шинэ үрчлүүлэх зар нэмэх
 */
export async function createAdoption(data: AdoptionInput): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү.');
  let photoUrl: string | null = null;
  let photoUrls: string[] = [];

  const files = (data.photoFiles?.length ? data.photoFiles : data.photoFile ? [data.photoFile] : []).slice(0, 4);
  if (files.length) {
    photoUrls = await Promise.all(files.map((file) => uploadAdoptionPhoto(file, user.id)));
    photoUrl = photoUrls[0];
  }

  const payload = {
      name: cleanText(data.name, 100, 'Нэр'),
      type: data.type,
      age: validatePetAge(cleanText(data.age, 100, 'Нас')),
      gender: data.gender || 'Тодорхойгүй',
      breed: cleanText(data.breed, 100, 'Үүлдэр'),
      description: cleanText(data.description, 2000, 'Тайлбар', true),
      district: data.district || '',
      place: cleanText(data.place, 300, 'Байршил', true),
      phone: requireMongolianPhone(data.phone),
      photo_url: photoUrl,
      photo_urls: photoUrls,
  };
  let result = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  // Migration ажиллаагүй орчинд эхний зургаар зарыг нийтлэх fallback.
  if (result.error && /photo_urls|schema cache/i.test(result.error.message)) {
    const { photo_urls: _photoUrls, ...legacyPayload } = payload;
    result = await supabase.from(TABLE).insert(legacyPayload).select().single();
  }

  const { data: inserted, error } = result;

  if (error) {
    if (error.message && error.message.includes('RATE_LIMIT:')) {
      throw new Error('Хэт олон удаа зар нийтлээ. 1 цагийн дараа дахин оролдоно уу.');
    }
    throw error;
  }
  return inserted.id;
}

/**
 * Тухайн ганц бичлэгийг ID-аар нь татах
 */
export async function fetchAdoptionById(id: string): Promise<Adoption> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return mapAdoptionRow(data);
}

/**
 * Жагсаалт татах — төрөл, хүйс, дүүргээр шүүх, текстээр хайх боломжтой
 */
export async function fetchAdoptions(filters: AdoptionFilters = {}): Promise<{ adoptions: Adoption[]; hasMore: boolean }> {
  const { type, gender, district, search, page = 0 } = filters;
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  q = q.eq('adopted', false);

  if (type) q = q.eq('type', type);
  if (gender) q = q.eq('gender', gender);
  if (district) q = q.eq('district', district);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%_]/g, '');
    q = q.or(`name.ilike.%${s}%,breed.ilike.%${s}%,description.ilike.%${s}%,place.ilike.%${s}%,type.ilike.%${s}%`);
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  q = q.range(from, to);

  const { data, error } = await q;
  if (error) throw error;

  const hasMore = data.length > PAGE_SIZE;
  const pageData = hasMore ? data.slice(0, PAGE_SIZE) : data;

  return {
    adoptions: pageData.map(mapAdoptionRow),
    hasMore,
  };
}

/**
 * Зохиогч өөрийн зарыг засах (текст талбарууд)
 */
export async function updateAdoption(id: string, fields: UpdateAdoptionFields): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      name: fields.name === undefined ? undefined : cleanText(fields.name, 100, 'Нэр'),
      type: fields.type ?? undefined,
      age: fields.age === undefined ? undefined : validatePetAge(cleanText(fields.age, 100, 'Нас')),
      gender: fields.gender ?? undefined,
      breed: fields.breed === undefined ? undefined : cleanText(fields.breed, 100, 'Үүлдэр'),
      description: fields.description === undefined ? undefined : cleanText(fields.description, 2000, 'Тайлбар', true),
      place: fields.place === undefined ? undefined : cleanText(fields.place, 300, 'Байршил', true),
      district: fields.district ?? undefined,
      phone: fields.phone === undefined ? undefined : requireMongolianPhone(fields.phone),
    })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Зохиогч өөрийн зарыг устгах
 */
export async function deleteAdoption(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/content/adoptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw await apiError(response);
}
