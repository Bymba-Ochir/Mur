// lib/adminService.ts
import { supabase } from './supabase';
import { mapPetSummary } from './petMapping';
import type { Report } from './types';

export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/**
 * Мэдээлэгдсэн бичлэгүүдийг тухайн pet-ийн мэдээлэлтэй хамт татна
 */
export async function fetchReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, pets(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((r): Report => ({
    id: r.id,
    reason: r.reason,
    createdAt: r.created_at,
    pet: r.pets ? mapPetSummary(r.pets) : null,
  }));
}

export async function dismissReport(reportId: string): Promise<void> {
  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (error) throw error;
}

export async function adminDeletePet(petId: string): Promise<void> {
  const { error } = await supabase.from('pets').delete().eq('id', petId);
  if (error) throw error;
}
