// lib/volunteerService.ts
import { supabase } from './supabase';
import { subscribeToNearbyAlerts } from './push';
import { DISTRICTS, type District } from './districts';

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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return false;
  const { data, error } = await supabase
    .from('volunteers')
    .select('id')
    .eq('user_id', user.id)
    .eq('district', district)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** One scalar COUNT from PostgreSQL, never a browser-side scan of volunteers. */
export async function fetchVolunteerCount(district: District): Promise<number> {
  if (!DISTRICTS.includes(district)) throw new Error('Invalid district');
  const { data, error } = await supabase.rpc('get_volunteer_count', { target_district: district });
  if (error) throw error;
  const count = typeof data === 'string' && /^\d+$/.test(data) ? Number(data) : data;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) throw new Error('Invalid volunteer count');
  return count;
}
