// lib/vaccineService.js
// "Миний амьтад" — хэрэглэгчийн өөрийн бүртгэлтэй амьтад, вакцины хугацааны сануулга
import { supabase } from './supabase';

const TABLE = 'my_pets';

export async function createMyPet({ name, type, nextVaccineDate }) {
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

export async function fetchMyPets() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    nextVaccineDate: p.next_vaccine_date,
    createdAt: p.created_at,
  }));
}

export async function updateVaccineDate(id, nextVaccineDate) {
  const { error } = await supabase
    .from(TABLE)
    .update({ next_vaccine_date: nextVaccineDate, last_notified_date: null })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMyPet(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/**
 * Вакцины хугацааны төлөв (UI-д өнгө/бичиг ялгахад ашиглана)
 * @returns {'overdue'|'soon'|'ok'|'none'}
 */
export function vaccineStatus(nextVaccineDate) {
  if (!nextVaccineDate) return 'none';
  const days = (new Date(nextVaccineDate) - new Date()) / (1000 * 60 * 60 * 24);
  if (days < 0) return 'overdue';
  if (days <= 14) return 'soon';
  return 'ok';
}
