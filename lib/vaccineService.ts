// lib/vaccineService.ts
// "Миний амьтад" — хэрэглэгчийн өөрийн бүртгэлтэй амьтад, вакцины хугацааны сануулга
import { supabase } from './supabase';
import type { MyPet, VaccineStatus } from './types';

const TABLE = 'my_pets';

// DB мөр (snake_case) → MyPet. RLS-ээс хамааралгүйгээр хэрэглэгчээ шүүх
// нь чухал тул бүх query-д user_id-г заавал `.eq()` хийнэ.
function mapMyPetRow(row: {
  id: string;
  name: string;
  type: string;
  next_vaccine_date: string | null;
  created_at: string;
}): MyPet {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    nextVaccineDate: row.next_vaccine_date,
    createdAt: row.created_at,
  };
}

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return user.id;
}

export async function createMyPet({
  name,
  type,
  nextVaccineDate,
}: {
  name: string;
  type: string;
  nextVaccineDate: string | null;
}): Promise<MyPet> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      name,
      type,
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

export async function updateVaccineDate(id: string, nextVaccineDate: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from(TABLE)
    .update({ next_vaccine_date: nextVaccineDate, last_notified_date: null })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
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
