// lib/vaccineService.ts
// "Миний амьтад" — хэрэглэгчийн өөрийн бүртгэлтэй амьтад, вакцины хугацааны сануулга
import { supabase } from './supabase';
import type { MyPet, UpdateMyPetFields, VaccineStatus } from './types';

const TABLE = 'my_pets';

// DB мөр (snake_case) → MyPet
function mapMyPetRow(row: Record<string, unknown>): MyPet {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    photoUrl: (row.photo_url as string) ?? null,
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
  name, type, age, breed, weight, nextVaccineName, nextVaccineDate,
}: {
  name: string;
  type: string;
  age?: string | null;
  breed?: string | null;
  weight?: number | null;
  nextVaccineName?: string | null;
  nextVaccineDate?: string | null;
}): Promise<MyPet> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      name,
      type,
      age: age || null,
      breed: breed || null,
      weight: weight ?? null,
      next_vaccine_name: nextVaccineName || null,
      next_vaccine_date: nextVaccineDate || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMyPetRow(data);
}

export async function fetchMyPets(): Promise<MyPet[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapMyPetRow);
}

/**
 * Амьтны мэдээллийг шинэчлэх (нэмэлт талбарууд)
 */
export async function updateMyPet(id: string, fields: UpdateMyPetFields): Promise<void> {
  const userId = await requireUserId();
  const updateData: Record<string, unknown> = {};
  if (fields.name !== undefined) updateData.name = fields.name;
  if (fields.type !== undefined) updateData.type = fields.type;
  if (fields.age !== undefined) updateData.age = fields.age || null;
  if (fields.breed !== undefined) updateData.breed = fields.breed || null;
  if (fields.weight !== undefined) updateData.weight = fields.weight ?? null;
  if (fields.nextVaccineName !== undefined) updateData.next_vaccine_name = fields.nextVaccineName || null;
  if (fields.nextVaccineDate !== undefined) {
    updateData.next_vaccine_date = fields.nextVaccineDate || null;
    // Сануулгыг дахин идэвхжүүлэх
    updateData.last_notified_date = null;
  }

  const { error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateVaccineDate(id: string, nextVaccineDate: string): Promise<void> {
  return updateMyPet(id, { nextVaccineDate });
}

export async function deleteMyPet(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

/**
 * Вакцины хугацааны төлөв (UI-д өнгө/бичиг ялгахад ашиглана)
 */
export function vaccineStatus(nextVaccineDate: string | null | undefined): VaccineStatus {
  if (!nextVaccineDate) return 'none';
  const days = (new Date(nextVaccineDate)
    .getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return 'overdue';
  if (days <= 14) return 'soon';
  return 'ok';
}
