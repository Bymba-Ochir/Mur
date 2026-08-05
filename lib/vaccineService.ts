// lib/vaccineService.ts
// "Миний амьтад" — хэрэглэгчийн өөрийн бүртгэлтэй амьтад, вакцины хугацааны сануулга
import { supabase } from './supabase';
import type { MyPet, VaccineStatus } from './types';

const TABLE = 'my_pets';

export async function createMyPet({
  name,
  type,
  nextVaccineDate,
}: {
  name: string;
  type: string;
  nextVaccineDate: string | null;
}): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      name,
      type,
      next_vaccine_date: nextVaccineDate || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMyPets(): Promise<MyPet[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((p): MyPet => ({
    id: p.id,
    name: p.name,
    type: p.type,
    nextVaccineDate: p.next_vaccine_date,
    createdAt: p.created_at,
  }));
}

export async function updateVaccineDate(id: string, nextVaccineDate: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ next_vaccine_date: nextVaccineDate, last_notified_date: null })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMyPet(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/**
 * Вакцины хугацааны төлөв (UI-д өнгө/бичиг ялгахад ашиглана)
 */
export function vaccineStatus(nextVaccineDate: string | null | undefined): VaccineStatus {
  if (!nextVaccineDate) return 'none';
  const days = (new Date(nextVaccineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return 'overdue';
  if (days <= 14) return 'soon';
  return 'ok';
}
