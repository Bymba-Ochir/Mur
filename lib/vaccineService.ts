// lib/vaccineService.ts
// "Миний амьтад" — хэрэглэгчийн өөрийн бүртгэлтэй амьтад, вакцины хугацааны сануулга
import { supabase } from './supabase';
import type { MyPet, UpdateMyPetFields, VaccineStatus } from './types';
import { cleanText, optionalDecimal, optionalIsoDate } from './inputValidation';
import { createIdempotencyKey } from './idempotency';
import { uploadMyPetPhoto, removeMyPetPhoto, validateMyPetPhoto } from './myPetPhoto';

const TABLE = 'my_pets';

// DB мөр (snake_case) → MyPet
function mapMyPetRow(row: Record<string, unknown>): MyPet {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    photoUrl: (row.photo_url as string) ?? null,
    markings: (row.markings as string) ?? null,
    age: (row.age as string) ?? null,
    breed: (row.breed as string) ?? null,
    weight: row.weight != null ? Number(row.weight) : null,
    nextVaccineName: (row.next_vaccine_name as string) ?? null,
    nextVaccineDate: (row.next_vaccine_date as string) ?? null,
    createdAt: row.created_at as string,
  };
}

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return user.id;
}

export async function createMyPet({
  name, type, age, breed, markings, photoFile, weight, nextVaccineName, nextVaccineDate,
}: {
  name: string;
  type: string;
  age?: string | null;
  breed?: string | null;
  markings?: string | null;
  photoFile?: File | null;
  weight?: number | null;
  nextVaccineName?: string | null;
  nextVaccineDate?: string | null;
}): Promise<MyPet> {
  const userId = await requireUserId();
  const cleanName = cleanText(name, 100, 'Амьтны нэр', true);
  const cleanType = cleanText(type, 50, 'Амьтны төрөл', true);

  const payload = {
      id: createIdempotencyKey(),
      user_id: userId,
      name: cleanName,
      type: cleanType,
      age: cleanText(age, 100, 'Нас') || null,
      breed: cleanText(breed, 100, 'Үүлдэр') || null,
      markings: cleanText(markings, 100, 'Онцгой шинж тэмдэг') || null,
      weight: optionalDecimal(weight, { min: 0, max: 999.99, label: 'Жин' }),
      next_vaccine_name: cleanText(nextVaccineName, 200, 'Вакцины нэр') || null,
      next_vaccine_date: optionalIsoDate(nextVaccineDate, 'Дараагийн вакцины огноо'),
    };
  const photoUrl = photoFile ? await uploadMyPetPhoto(photoFile, userId, payload.id) : null;
  const { data, error } = await supabase.from(TABLE).insert({ ...payload, photo_url: photoUrl }).select().single();
  if (error) {
    if (photoUrl) await removeMyPetPhoto(photoUrl, userId).catch(() => {});
    throw error;
  }
  return mapMyPetRow(data);
}

export async function fetchMyPets(page?: { offset: number; limit: number }): Promise<MyPet[]> {
  if (page && (!Number.isSafeInteger(page.offset) || page.offset < 0
    || !Number.isSafeInteger(page.limit) || page.limit < 1 || page.limit > 50)) {
    throw new Error('Invalid pet page');
  }
  const userId = await requireUserId();
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (page) query = query.range(page.offset, page.offset + page.limit - 1);
  const { data, error } = await query;

  if (error) throw error;
  return data.map(mapMyPetRow);
}

/**
 * Ганц "Миний амьтан"-ыг ID-аар татах.
 * RLS нь зөвхөн эзэмшигчид буцаана.
 */
export async function fetchMyPetById(id: string): Promise<MyPet> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Амьтан олдсонгүй эсвэл таны харьяалалд ороогүй байна.');
  return mapMyPetRow(data);
}

/**
 * Амьтны мэдээллийг шинэчлэх (нэмэлт талбарууд)
 */
export async function updateMyPet(id: string, fields: UpdateMyPetFields): Promise<void> {
  const userId = await requireUserId();
  const updateData: Record<string, unknown> = {};
  if (fields.name !== undefined) updateData.name = cleanText(fields.name, 100, 'Амьтны нэр', true);
  if (fields.type !== undefined) updateData.type = cleanText(fields.type, 50, 'Амьтны төрөл', true);
  if (fields.age !== undefined) updateData.age = cleanText(fields.age, 100, 'Нас') || null;
  if (fields.breed !== undefined) updateData.breed = cleanText(fields.breed, 100, 'Үүлдэр') || null;
  if (fields.markings !== undefined) updateData.markings = cleanText(fields.markings, 100, 'Онцгой шинж тэмдэг') || null;
  if (fields.weight !== undefined) updateData.weight = optionalDecimal(fields.weight, { min: 0, max: 999.99, label: 'Жин' });
  if (fields.nextVaccineName !== undefined) updateData.next_vaccine_name = cleanText(fields.nextVaccineName, 200, 'Вакцины нэр') || null;
  if (fields.nextVaccineDate !== undefined) {
    updateData.next_vaccine_date = optionalIsoDate(fields.nextVaccineDate, 'Дараагийн вакцины огноо');
    // Сануулгыг дахин идэвхжүүлэх
    updateData.last_notified_date = null;
  }

  let previousPhoto: string | null = null;
  let uploadedPhoto: string | null = null;
  if (fields.photoFile !== undefined) {
    if (fields.photoFile) validateMyPetPhoto(fields.photoFile);
    const owned = await fetchMyPetById(id);
    previousPhoto = owned.photoUrl;
    uploadedPhoto = fields.photoFile ? await uploadMyPetPhoto(fields.photoFile, userId, id) : null;
    updateData.photo_url = uploadedPhoto;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id').maybeSingle();
  if (error || !data) {
    if (uploadedPhoto) await removeMyPetPhoto(uploadedPhoto, userId).catch(() => {});
    throw error || new Error('Амьтны мэдээллийг хадгалж чадсангүй.');
  }
  if (fields.photoFile !== undefined && previousPhoto) await removeMyPetPhoto(previousPhoto, userId).catch(() => {});
}

export async function updateVaccineDate(id: string, nextVaccineDate: string): Promise<void> {
  return updateMyPet(id, { nextVaccineDate });
}

export async function deleteMyPet(id: string): Promise<void> {
  const userId = await requireUserId();
  const pet = await fetchMyPetById(id);
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  if (pet.photoUrl) await removeMyPetPhoto(pet.photoUrl, userId).catch(() => {});
}

/**
 * Вакцины хугацааны төлөв (UI-д өнгө/бичиг ялгахад ашиглана)
 */
export function vaccineStatus(nextVaccineDate: string | null | undefined): VaccineStatus {
  if (!nextVaccineDate) return 'none';
  const due = new Date(`${nextVaccineDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 'none';
  const today = new Date();
  const days = (Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) -
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000;
  if (days < 0) return 'overdue';
  if (days <= 14) return 'soon';
  return 'ok';
}
