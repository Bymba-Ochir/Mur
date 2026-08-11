import { supabase } from './supabase';
import { mapPetSummary } from './petMapping';
import type { Report, VetClinic, VetService } from './types';

export type AdminTab = 'dashboard' | 'reports' | 'listings' | 'users' | 'adoptions' | 'sitting' | 'clinics' | 'appointments' | 'donations' | 'system' | 'audit';

export interface AdminStats {
  users: number; pets: number; activePets: number; resolvedPets: number;
  adoptions: number; sitting: number; openReports: number; appointments: number;
  pendingAppointments: number; paidDonations: number; todayListings: number; pushSubscriptions: number;
}
export interface AdminUser { user_id: string; email: string; created_at: string; last_sign_in_at: string | null; banned_until: string | null; warning_count: number; pet_count: number; adoption_count: number; }
export interface AdminListing { id: string; kind: 'pet'|'adoption'|'sitting'; title: string; subtitle: string; status: string; hidden: boolean; createdAt: string; }
export interface AdminAppointment { id: string; clinic_id: string; service: string; date: string; time_slot: string; status: string; notes: string | null; created_at: string; }
export interface AdminDonation { id: string; amount: number; supporter_name: string | null; is_anonymous: boolean; status: string; invoice_id: string | null; created_at: string; }
export interface AuditLog { id: number; action: string; target_type: string; target_id: string | null; reason: string | null; metadata: Record<string, unknown>; created_at: string; }
export interface SystemHealth { databaseSize: number; petPhotos: number; failedDonations: number; stalePendingDonations: number; overdueAppointments: number; lastAuditAt: string | null; }

function throwIf(error: { message?: string } | null) { if (error) throw error; }
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_current_admin');
  return !error && data === true;
}
export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_dashboard_stats'); throwIf(error); return data as AdminStats;
}
export async function fetchSystemHealth(): Promise<SystemHealth> {
  const { data, error } = await supabase.rpc('admin_system_health'); throwIf(error); return data as SystemHealth;
}
export async function fetchAdminUsers(search = ''): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users', { p_search: search, p_limit: 100 }); throwIf(error); return (data || []) as AdminUser[];
}
export async function moderateUser(userId: string, action: 'warn'|'ban'|'unban', reason = '', days = 7) {
  const { error } = await supabase.rpc('admin_moderate_user', { p_user_id: userId, p_action: action, p_reason: reason || null, p_ban_days: days }); throwIf(error);
}
export async function writeAudit(action: string, targetType: string, targetId?: string, reason?: string, metadata: Record<string, unknown> = {}) {
  const { error } = await supabase.rpc('write_admin_audit', { p_action: action, p_target_type: targetType, p_target_id: targetId || null, p_reason: reason || null, p_metadata: metadata }); throwIf(error);
}

export async function fetchReports(): Promise<Report[]> {
  const { data, error } = await supabase.from('reports').select('*, pets(*)').in('status', ['open','reviewing']).order('created_at', { ascending: false });
  throwIf(error);
  return (data || []).map((r): Report => ({ id: r.id, reason: r.reason, createdAt: r.created_at, pet: r.pets ? mapPetSummary(r.pets) : null }));
}
export async function resolveReport(reportId: string, status: 'resolved'|'dismissed', note = '') {
  const { error } = await supabase.from('reports').update({ status, resolved_at: new Date().toISOString(), resolution_note: note || null }).eq('id', reportId); throwIf(error);
  await writeAudit(`report_${status}`, 'report', reportId, note);
}
export const dismissReport = (id: string) => resolveReport(id, 'dismissed');

export async function fetchAdminListings(kind: 'pet'|'adoption'|'sitting'): Promise<AdminListing[]> {
  if (kind === 'pet') {
    const { data, error } = await supabase.from('pets').select('id,name,type,status,district,resolved,is_hidden,created_at').order('created_at',{ascending:false}).limit(200); throwIf(error);
    return (data||[]).map(x=>({id:x.id,kind,title:`${x.name||x.type} · ${x.status}`,subtitle:x.district||'',status:x.resolved?'resolved':'active',hidden:!!x.is_hidden,createdAt:x.created_at}));
  }
  if (kind === 'adoption') {
    const { data, error } = await supabase.from('adoptions').select('id,name,type,district,moderation_status,created_at').order('created_at',{ascending:false}).limit(200); throwIf(error);
    return (data||[]).map(x=>({id:x.id,kind,title:x.name||x.type,subtitle:x.district||'',status:x.moderation_status,hidden:['hidden','rejected'].includes(x.moderation_status),createdAt:x.created_at}));
  }
  const { data, error } = await supabase.from('sitting_listings').select('id,pet_type,district,place,moderation_status,created_at').order('created_at',{ascending:false}).limit(200); throwIf(error);
  return (data||[]).map(x=>({id:x.id,kind,title:`${x.pet_type} асрах`,subtitle:`${x.district||''} ${x.place||''}`.trim(),status:x.moderation_status,hidden:['hidden','rejected'].includes(x.moderation_status),createdAt:x.created_at}));
}
export async function moderateListing(item: AdminListing, action: 'show'|'hide'|'approve'|'reject'|'resolve'|'feature', reason = '') {
  if (item.kind === 'pet') {
    const patch = action==='resolve'?{resolved:true}:action==='feature'?{is_featured:true}:{is_hidden:action==='hide',admin_note:reason||null};
    const {error}=await supabase.from('pets').update(patch).eq('id',item.id); throwIf(error);
  } else {
    const table=item.kind==='adoption'?'adoptions':'sitting_listings';
    const status=action==='show'||action==='approve'?'approved':action==='reject'?'rejected':'hidden';
    const {error}=await supabase.from(table).update({moderation_status:status,admin_note:reason||null}).eq('id',item.id); throwIf(error);
  }
  await writeAudit(`listing_${action}`,item.kind,item.id,reason);
}
export async function adminDeletePet(petId: string): Promise<void> { const {error}=await supabase.from('pets').delete().eq('id',petId); throwIf(error); await writeAudit('listing_delete','pet',petId); }

export async function fetchAdminAppointments(): Promise<AdminAppointment[]> { const {data,error}=await supabase.from('appointments').select('*').order('created_at',{ascending:false}).limit(200); throwIf(error); return (data||[]) as AdminAppointment[]; }
export async function updateAppointmentStatus(id:string,status:string){const{error}=await supabase.from('appointments').update({status}).eq('id',id);throwIf(error);await writeAudit('appointment_status','appointment',id,status);}
export async function fetchAdminDonations(): Promise<AdminDonation[]> { const {data,error}=await supabase.from('donations').select('id,amount,supporter_name,is_anonymous,status,invoice_id,created_at').order('created_at',{ascending:false}).limit(200);throwIf(error);return(data||[]) as AdminDonation[];}
export async function fetchAuditLogs(): Promise<AuditLog[]> { const {data,error}=await supabase.from('admin_audit_logs').select('*').order('created_at',{ascending:false}).limit(200);throwIf(error);return(data||[]) as AuditLog[];}

export async function fetchAdminClinics(): Promise<VetClinic[]> { const {data,error}=await supabase.from('vet_clinics').select('*').order('name');throwIf(error);return(data||[]).map(x=>({id:x.id,name:x.name,district:x.district,address:x.address,phone:x.phone,hours:x.hours,note:x.note||undefined,lat:x.lat,lng:x.lng,services:x.services as VetService[]}));}
export async function saveClinic(clinic: VetClinic) { const {error}=await supabase.from('vet_clinics').upsert({id:clinic.id,name:clinic.name,district:clinic.district,address:clinic.address,phone:clinic.phone,hours:clinic.hours,note:clinic.note||null,lat:clinic.lat,lng:clinic.lng,services:clinic.services,updated_at:new Date().toISOString()});throwIf(error);await writeAudit('clinic_save','clinic',clinic.id);}
export async function deleteClinic(id:string){const{error}=await supabase.from('vet_clinics').delete().eq('id',id);throwIf(error);await writeAudit('clinic_delete','clinic',id);}
