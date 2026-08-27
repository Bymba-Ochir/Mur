// lib/adminService.ts
import { supabase } from './supabase';
import { mapPetSummary } from './petMapping';
import type { Report } from './types';

export type AdminContentType = 'pet' | 'adoption' | 'sitting';

export interface AdminStats {
  pets: number;
  activePets: number;
  resolvedPets: number;
  adoptions: number;
  sitting: number;
  reports: number;
}

export interface AdminContentItem {
  id: string;
  kind: AdminContentType;
  title: string;
  subtitle: string;
  image: string | null;
  createdAt: string;
  href: string;
}

export interface AdminAuditItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

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
  await writeAudit('delete', 'pet', petId);
}

async function exactCount(table: string, apply?: (query: any) => any): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [pets, activePets, resolvedPets, adoptions, sitting, reports] = await Promise.all([
    exactCount('pets'),
    exactCount('pets', (q) => q.eq('resolved', false)),
    exactCount('pets', (q) => q.eq('resolved', true)),
    exactCount('adoptions'),
    exactCount('sitting_listings'),
    exactCount('reports'),
  ]);
  return { pets, activePets, resolvedPets, adoptions, sitting, reports };
}

export async function fetchAdminContent(): Promise<AdminContentItem[]> {
  const [petsResult, adoptionsResult, sittingResult] = await Promise.all([
    supabase.from('pets').select('id,status,name,type,district,photo_url,created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('adoptions').select('id,name,type,district,photo_url,created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('sitting_listings').select('id,pet_type,district,place,photo_url,created_at').order('created_at', { ascending: false }).limit(100),
  ]);
  if (petsResult.error) throw petsResult.error;
  if (adoptionsResult.error) throw adoptionsResult.error;
  if (sittingResult.error) throw sittingResult.error;

  return [
    ...petsResult.data.map((row) => ({
      id: row.id, kind: 'pet' as const,
      title: `${row.status === 'lost' ? 'Алдсан' : 'Олдсон'} · ${row.name || row.type}`,
      subtitle: `${row.type} · ${row.district || 'Байршилгүй'}`,
      image: row.photo_url, createdAt: row.created_at, href: `/pets/${row.id}`,
    })),
    ...adoptionsResult.data.map((row) => ({
      id: row.id, kind: 'adoption' as const,
      title: `Үрчлүүлэх · ${row.name || row.type}`,
      subtitle: `${row.type} · ${row.district || 'Байршилгүй'}`,
      image: row.photo_url, createdAt: row.created_at, href: `/adoptions/${row.id}`,
    })),
    ...sittingResult.data.map((row) => ({
      id: row.id, kind: 'sitting' as const,
      title: `Асрах · ${row.pet_type}`,
      subtitle: `${row.district || 'Байршилгүй'}${row.place ? ` · ${row.place}` : ''}`,
      image: row.photo_url, createdAt: row.created_at, href: `/sitting/${row.id}`,
    })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function adminDeleteContent(kind: AdminContentType, id: string): Promise<void> {
  const table = kind === 'pet' ? 'pets' : kind === 'adoption' ? 'adoptions' : 'sitting_listings';
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  await writeAudit('delete', kind, id);
}

export async function writeAudit(action: string, targetType: string, targetId?: string, details: Record<string, unknown> = {}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_id: user.id, action, target_type: targetType, target_id: targetId ?? null, details,
  });
  // Upgrade SQL хараахан ажиллаагүй үед үндсэн moderation-ийг audit log зогсоох ёсгүй.
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') console.warn('Admin audit log:', error.message);
}

export async function fetchAdminAudit(): Promise<AdminAuditItem[]> {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('id,action,target_type,target_id,details,created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    if (error.code === '42P01' || error.code === '42703' || error.code === 'PGRST204' || error.code === 'PGRST205') return [];
    throw error;
  }
  return data.map((row) => ({
    id: row.id, action: row.action, targetType: row.target_type,
    targetId: row.target_id, details: row.details ?? {}, createdAt: row.created_at,
  }));
}
