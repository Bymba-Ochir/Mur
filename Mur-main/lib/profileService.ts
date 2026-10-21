import { supabase } from './supabase';
import { cleanText } from './inputValidation';
import type { District } from './districts';

export interface NotificationPreferences {
  messages: boolean;
  matches: boolean;
  vaccines: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  district: District | null;
  bio: string;
  isVolunteer: boolean;
  emailVerified: boolean;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
}

export interface ProfileStats {
  pets: number;
  resolved: number;
  adoptions: number;
  sitting: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = { messages: true, matches: true, vaccines: true };

function mapProfile(row: Record<string, unknown>): UserProfile {
  const preferences = (row.notification_preferences ?? {}) as Partial<NotificationPreferences>;
  return {
    id: row.id as string,
    displayName: (row.display_name as string) || 'МӨР хэрэглэгч',
    avatarUrl: (row.avatar_url as string) || null,
    district: (row.district as District) || null,
    bio: (row.bio as string) || '',
    isVolunteer: Boolean(row.is_volunteer),
    emailVerified: Boolean(row.email_verified),
    notificationPreferences: { ...DEFAULT_PREFERENCES, ...preferences },
    createdAt: row.created_at as string,
  };
}

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү.');
  return user.id;
}

export async function ensureMyProfile(): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү.');
  const { data: existing, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (existing) return mapProfile(existing);
  const { data, error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'МӨР хэрэглэгч',
    email_verified: Boolean(user.email_confirmed_at),
  }).select().single();
  if (insertError) throw insertError;
  return mapProfile(data);
}

export async function fetchProfile(id: string): Promise<UserProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Хэрэглэгчийн profile олдсонгүй.');
  return mapProfile(data);
}

export async function fetchProfileStats(id: string): Promise<ProfileStats> {
  const count = async (table: string, column: string, resolved?: boolean) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, id);
    if (resolved !== undefined) query = query.eq('resolved', resolved);
    const { count: value, error } = await query;
    if (error) throw error;
    return value ?? 0;
  };
  const [pets, resolved, adoptions, sitting] = await Promise.all([
    count('pets', 'created_by'), count('pets', 'created_by', true),
    count('adoptions', 'created_by'), count('sitting_listings', 'user_id'),
  ]);
  return { pets, resolved, adoptions, sitting };
}

export async function updateMyProfile(input: {
  displayName: string; district: District | ''; bio: string; isVolunteer: boolean;
  notificationPreferences?: NotificationPreferences;
}): Promise<void> {
  const id = await requireUserId();
  const payload: Record<string, unknown> = {
    display_name: cleanText(input.displayName, 100, 'Нэр', true),
    district: input.district || null,
    bio: cleanText(input.bio, 500, 'Танилцуулга'),
    is_volunteer: input.isVolunteer,
    updated_at: new Date().toISOString(),
  };
  if (input.notificationPreferences) payload.notification_preferences = input.notificationPreferences;
  const { error } = await supabase.from('profiles').update(payload).eq('id', id);
  if (error) throw error;
}

export async function uploadMyAvatar(file: File): Promise<string> {
  const id = await requireUserId();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG эсвэл WebP зураг сонгоно уу.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Profile зураг 2MB-аас бага байх ёстой.');
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return avatarUrl;
}

export async function isUserBlocked(blockedId: string): Promise<boolean> {
  const id = await requireUserId();
  const { data, error } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', id).eq('blocked_id', blockedId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function setUserBlocked(blockedId: string, blocked: boolean): Promise<void> {
  const id = await requireUserId();
  if (id === blockedId) throw new Error('Өөрийгөө хаах боломжгүй.');
  const query = blocked
    ? supabase.from('user_blocks').upsert({ blocker_id: id, blocked_id: blockedId })
    : supabase.from('user_blocks').delete().eq('blocker_id', id).eq('blocked_id', blockedId);
  const { error } = await query;
  if (error) throw error;
}

export async function reportUser(reportedId: string, reason: string): Promise<void> {
  const id = await requireUserId();
  if (id === reportedId) throw new Error('Өөрийн profile-ийг мэдээлэх боломжгүй.');
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: id, reported_id: reportedId, reason: cleanText(reason, 500, 'Шалтгаан', true),
  });
  if (error?.code === '23505') throw new Error('Энэ хэрэглэгчийг шалгуулахаар өмнө нь илгээсэн байна.');
  if (error) throw error;
}
