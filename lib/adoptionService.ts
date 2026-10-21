import { validatePetAge } from './petAge';
// lib/adoptionService.ts
// Үрчлүүлэх амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { mapAdoptionRow } from './adoptionMapping';
import type { Adoption, AdoptionInput, AdoptionFilters, UpdateAdoptionFields } from './types';
import { cleanText, requireMongolianPhone } from './inputValidation';
import { apiError, authenticatedFetch } from './apiClient';
import { createIdempotencyKey, idempotentFileName, isIdempotencyKey } from './idempotency';
import { hydrateListingPhotos, saveListingPhotos } from './photoRepository';

const TABLE = 'adoptions';
const BUCKET = 'pet-photos';
const PAGE_SIZE = 24;

/**
 * Зураг Storage bucket-д хуулаад, public URL буцаана
 */
async function uploadAdoptionPhoto(file: File, userId: string, mutationId: string, index: number): Promise<string> {
  const path = `${userId}/adoptions/${idempotentFileName(mutationId, index, file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error && !/already exists|duplicate|resource already exists/i.test(error.message)) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function persistAdoptionPhotoUrls(adoptionId: string, photoUrls: string[]): Promise<void> {
  const normalized = await saveListingPhotos('adoption', adoptionId, photoUrls);
  if (normalized) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ photo_url: photoUrls[0] ?? null, photo_urls: photoUrls })
    .eq('id', adoptionId);
  if (error) throw error;
}

/**
 * Шинэ үрчлүүлэх зар нэмэх
 */
export async function createAdoption(data: AdoptionInput, mutationId = createIdempotencyKey()): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү.');
  if (!isIdempotencyKey(mutationId)) throw new Error('Үйлдлийн дугаар буруу байна.');

  const files = (data.photoFiles?.length ? data.photoFiles : data.photoFile ? [data.photoFile] : []).slice(0, 4);
  const { data: existing, error: existingError } = await supabase.from(TABLE).select('id,created_by').eq('id', mutationId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.created_by !== user.id) throw new Error('Үйлдлийн дугаар давхардлаа. Дахин оролдоно уу.');
    if (files.length) {
      const retryUrls = await Promise.all(files.map((file, index) => uploadAdoptionPhoto(file, user.id, mutationId, index)));
      await persistAdoptionPhotoUrls(existing.id, retryUrls);
    }
    return existing.id;
  }

  let photoUrls: string[] = [];

  if (files.length) {
    photoUrls = await Promise.all(files.map((file, index) => uploadAdoptionPhoto(file, user.id, mutationId, index)));
  }

  const payload = {
      id: mutationId,
      created_by: user.id,
      name: cleanText(data.name, 100, 'Нэр'),
      type: data.type,
      age: validatePetAge(cleanText(data.age, 100, 'Нас')),
      gender: data.gender || 'Тодорхойгүй',
      breed: cleanText(data.breed, 100, 'Үүлдэр'),
      description: cleanText(data.description, 2000, 'Тайлбар', true),
      district: data.district || '',
      place: cleanText(data.place, 300, 'Байршил', true),
      phone: requireMongolianPhone(data.phone),
  };
  const result = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  const { data: inserted, error } = result;

  if (error) {
    if (error.code === '23505') {
      const { data: raced, error: racedError } = await supabase.from(TABLE).select('id,created_by').eq('id', mutationId).maybeSingle();
      if (racedError) throw racedError;
      if (raced?.created_by === user.id) {
        if (photoUrls.length) await persistAdoptionPhotoUrls(raced.id, photoUrls);
        return raced.id;
      }
    }
    if (error.message && error.message.includes('RATE_LIMIT:')) {
      throw new Error('Хэт олон удаа зар нийтлээ. 1 цагийн дараа дахин оролдоно уу.');
    }
    throw error;
  }

  await persistAdoptionPhotoUrls(inserted.id, photoUrls);

  return inserted.id;
}

/**
 * Тухайн ганц бичлэгийг ID-аар нь татах
 */
export async function fetchAdoptionById(id: string): Promise<Adoption> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  const [row] = await hydrateListingPhotos('adoption', [data]);
  return mapAdoptionRow(row);
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
  const hydrated = await hydrateListingPhotos('adoption', pageData);

  return {
    adoptions: hydrated.map(mapAdoptionRow),
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
