// lib/adoptionService.ts
// Үрчлүүлэх амьтны мэдээллийг Supabase (Postgres + Storage)-д бичих, унших функцууд
import { supabase } from './supabase';
import { mapAdoptionRow } from './adoptionMapping';
import type { Adoption, AdoptionInput, AdoptionFilters, UpdateAdoptionFields } from './types';

const TABLE = 'adoptions';
const BUCKET = 'pet-photos';
const PAGE_SIZE = 24;

/**
 * Зураг Storage bucket-д хуулаад, public URL буцаана
 */
async function uploadAdoptionPhoto(file: File): Promise<string> {
  const path = `adoptions/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Шинэ үрчлүүлэх зар нэмэх
 */
export async function createAdoption(data: AdoptionInput): Promise<string> {
  let photoUrl: string | null = null;

  if (data.photoFile) {
    photoUrl = await uploadAdoptionPhoto(data.photoFile);
  }

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert({
      name: data.name || '',
      type: data.type,
      age: data.age || '',
      gender: data.gender || 'Тодорхойгүй',
      breed: data.breed || '',
      description: data.description || '',
      district: data.district || '',
      place: data.place || '',
      phone: data.phone || '',
      photo_url: photoUrl,
    })
    .select()
    .single();

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
      name: fields.name ?? undefined,
      type: fields.type ?? undefined,
      age: fields.age ?? undefined,
      gender: fields.gender ?? undefined,
      breed: fields.breed ?? undefined,
      description: fields.description ?? undefined,
      place: fields.place ?? undefined,
      district: fields.district ?? undefined,
      phone: fields.phone ?? undefined,
    })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Зохиогч өөрийн зарыг устгах
 */
export async function deleteAdoption(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
