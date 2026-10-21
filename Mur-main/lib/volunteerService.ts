// lib/volunteerService.ts
import { supabase } from './supabase';
import { subscribeToNearbyAlerts } from './push';
import type { District } from './districts';

export async function joinAsVolunteer(district: District): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');

  const { error } = await supabase
    .from('volunteers')
    .insert({ user_id: user.id, district });
  if (error && !error.message.includes('duplicate')) throw error;

  // Сайн дурын идэвхтэн болохын хамт тухайн дүүргийн push мэдэгдэлд ч бүртгүүлнэ
  try {
    await subscribeToNearbyAlerts(district);
  } catch {
    // Push зөвшөөрөл өгөөгүй ч гэсэн volunteer бүртгэл амжилттай үлдэнэ
  }
}

export async function leaveAsVolunteer(district: District): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('volunteers')
    .delete()
    .eq('user_id', user.id)
    .eq('district', district);
  if (error) throw error;
}

export async function isVolunteer(district: District): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('volunteers')
    .select('id')
    .eq('user_id', user.id)
    .eq('district', district)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/**
 * Дүүрэг бүрийн сайн дурын идэвхтний тоог буцаана: { 'Баянзүрх': 5, ... }
 */
export async function fetchVolunteerCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('volunteers').select('district');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.district] = (counts[row.district] || 0) + 1;
  }
  return counts;
}
