import { ulaanbaatarDate } from './bookingDate';
import { supabase } from './supabase';
import { assertDateOrder, cleanText, optionalIsoDate } from './inputValidation';
import { COMPACT_PAGE_SIZE, finalizePage, pageWindow, type PageResult } from './pagination';

export type WorkflowStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export interface AdoptionApplication { id: string; adoptionId: string; applicantId: string; ownerId: string; message: string; status: Exclude<WorkflowStatus, 'completed'>; createdAt: string; }
export interface SittingBooking { id: string; listingId: string; customerId: string; sitterId: string; startDate: string; endDate: string; note: string; totalPrice: number | null; status: WorkflowStatus; createdAt: string; }
export interface SittingReview { id: string; bookingId: string; reviewerId: string; sitterId: string; rating: number; comment: string; createdAt: string; }
export interface AppNotification { id: string; type: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string; }

interface AdoptionApplicationRow { id: string; adoption_id: string; applicant_id: string; owner_id: string; message: string; status: AdoptionApplication['status']; created_at: string; }
interface SittingBookingRow { id: string; listing_id: string; customer_id: string; sitter_id: string; start_date: string; end_date: string; note: string | null; total_price: number | string | null; status: WorkflowStatus; created_at: string; }
interface SittingReviewRow { id: string; booking_id: string; reviewer_id: string; sitter_id: string; rating: number | string; comment: string | null; created_at: string; }

function adoptionRow(row: AdoptionApplicationRow): AdoptionApplication { return { id: row.id, adoptionId: row.adoption_id, applicantId: row.applicant_id, ownerId: row.owner_id, message: row.message, status: row.status, createdAt: row.created_at }; }
function bookingRow(row: SittingBookingRow): SittingBooking { return { id: row.id, listingId: row.listing_id, customerId: row.customer_id, sitterId: row.sitter_id, startDate: row.start_date, endDate: row.end_date, note: row.note || '', totalPrice: row.total_price == null ? null : Number(row.total_price), status: row.status, createdAt: row.created_at }; }
function reviewRow(row: SittingReviewRow): SittingReview { return { id: row.id, bookingId: row.booking_id, reviewerId: row.reviewer_id, sitterId: row.sitter_id, rating: Number(row.rating), comment: row.comment || '', createdAt: row.created_at }; }

async function userId(): Promise<string> { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Эхлээд нэвтэрнэ үү.'); return user.id; }

export async function createAdoptionApplication(adoptionId: string, message: string): Promise<void> {
  const id = await userId(); const cleaned = cleanText(message, 1000, 'Хүсэлтийн тайлбар', true);
  if (cleaned.length < 10) throw new Error('Хүсэлтийн тайлбар 10-аас доошгүй тэмдэгт байна.');
  const { error } = await supabase.from('adoption_applications').insert({ adoption_id: adoptionId, applicant_id: id, owner_id: id, message: cleaned });
  if (error?.code === '23505') {
    const { data: existing, error: existingError } = await supabase.from('adoption_applications').select('message').eq('adoption_id', adoptionId).eq('applicant_id', id).eq('status', 'pending').maybeSingle();
    if (existingError) throw existingError;
    if (existing?.message === cleaned) return;
    throw new Error('Та энэ зар дээр хүлээгдэж буй хүсэлттэй байна.');
  }
  if (error) throw error;
}
export async function fetchAdoptionApplications(adoptionId: string): Promise<AdoptionApplication[]> { const { data, error } = await supabase.from('adoption_applications').select('*').eq('adoption_id', adoptionId).order('created_at', { ascending: false }); if (error) throw error; return data.map(adoptionRow); }
export async function fetchMyAdoptionApplicationsPage(page = 0): Promise<PageResult<AdoptionApplication>> {
  await userId();
  const window = pageWindow(page, COMPACT_PAGE_SIZE);
  const { data, error, count } = await supabase
    .from('adoption_applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(window.from, window.to);
  if (error) throw error;
  const result = finalizePage(data, window.page, window.pageSize, count);
  return { ...result, items: result.items.map(adoptionRow) };
}

export async function fetchMyAdoptionApplications(): Promise<AdoptionApplication[]> {
  return (await fetchMyAdoptionApplicationsPage(0)).items;
}
export async function updateAdoptionApplication(id: string, status: 'accepted' | 'rejected' | 'cancelled'): Promise<void> { const { error } = await supabase.from('adoption_applications').update({ status }).eq('id', id).neq('status', status); if (error) throw error; }

export async function createSittingBooking(listingId: string, start: string, end: string, note: string): Promise<void> {
  const id = await userId(); const startDate = optionalIsoDate(start, 'Эхлэх огноо'); const endDate = optionalIsoDate(end, 'Дуусах огноо');
  if (!startDate || !endDate) throw new Error('Эхлэх болон дуусах огноо оруулна уу.'); assertDateOrder(startDate, endDate);
  if (startDate < ulaanbaatarDate()) throw new Error('Өнгөрсөн огноогоор захиалга үүсгэх боломжгүй.');
  const cleanedNote = cleanText(note, 1000, 'Тайлбар') || null;
  const { error } = await supabase.from('sitting_bookings').insert({ listing_id: listingId, customer_id: id, sitter_id: id, start_date: startDate, end_date: endDate, note: cleanedNote });
  if (error?.code === '23505') {
    const { data: existing, error: existingError } = await supabase.from('sitting_bookings').select('note,status').eq('listing_id', listingId).eq('customer_id', id).eq('start_date', startDate).eq('end_date', endDate).in('status', ['pending', 'accepted']).maybeSingle();
    if (existingError) throw existingError;
    if (existing && (existing.note ?? null) === cleanedNote) return;
    throw new Error('Ижил хугацааны идэвхтэй захиалга байна.');
  }
  if (error) throw error;
}
export async function fetchSittingBookings(listingId: string): Promise<SittingBooking[]> { const { data, error } = await supabase.from('sitting_bookings').select('*').eq('listing_id', listingId).order('created_at', { ascending: false }); if (error) throw error; return data.map(bookingRow); }
export async function fetchMySittingBookingsPage(page = 0): Promise<PageResult<SittingBooking>> {
  await userId();
  const window = pageWindow(page, COMPACT_PAGE_SIZE);
  const { data, error, count } = await supabase
    .from('sitting_bookings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(window.from, window.to);
  if (error) throw error;
  const result = finalizePage(data, window.page, window.pageSize, count);
  return { ...result, items: result.items.map(bookingRow) };
}

export async function fetchMySittingBookings(): Promise<SittingBooking[]> {
  return (await fetchMySittingBookingsPage(0)).items;
}
export async function updateSittingBooking(id: string, status: 'accepted' | 'rejected' | 'completed' | 'cancelled'): Promise<void> { const { error } = await supabase.from('sitting_bookings').update({ status }).eq('id', id).neq('status', status); if (error) throw error; }
export async function fetchSittingReviews(sitterId: string): Promise<SittingReview[]> { const { data, error } = await supabase.from('sitting_reviews').select('*').eq('sitter_id', sitterId).order('created_at', { ascending: false }); if (error) throw error; return data.map(reviewRow); }
export async function createSittingReview(bookingId: string, sitterId: string, rating: number, comment: string): Promise<void> { const id = await userId(); if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('1–5 од сонгоно уу.'); const cleanedComment = cleanText(comment, 1000, 'Сэтгэгдэл') || null; const { error } = await supabase.from('sitting_reviews').insert({ booking_id: bookingId, reviewer_id: id, sitter_id: sitterId, rating, comment: cleanedComment }); if (error?.code === '23505') { const { data: existing, error: existingError } = await supabase.from('sitting_reviews').select('reviewer_id,sitter_id,rating,comment').eq('booking_id', bookingId).maybeSingle(); if (existingError) throw existingError; if (existing?.reviewer_id === id && existing.sitter_id === sitterId && Number(existing.rating) === rating && (existing.comment ?? null) === cleanedComment) return; throw new Error('Энэ захиалгыг өмнө нь үнэлсэн байна.'); } if (error) throw error; }

export async function fetchNotificationsPage(page = 0, unreadOnly = false): Promise<PageResult<AppNotification>> {
  const window = pageWindow(page, COMPACT_PAGE_SIZE);
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (unreadOnly) query = query.is('read_at', null);
  const { data, error, count } = await query.range(window.from, window.to);
  if (error) throw error;
  const result = finalizePage(data, window.page, window.pageSize, count);
  return {
    ...result,
    items: result.items.map((row) => ({ id: row.id, type: row.type, title: row.title, body: row.body, href: row.href, readAt: row.read_at, createdAt: row.created_at })),
  };
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  return (await fetchNotificationsPage(0)).items;
}
export async function notificationCount(): Promise<number> { const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }); if (error) return 0; return count ?? 0; }
export async function unreadNotificationCount(): Promise<number> { const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null); if (error) return 0; return count ?? 0; }
export async function markNotificationRead(id: string): Promise<void> { const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null); if (error) throw error; }
export async function markAllNotificationsRead(): Promise<void> { const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null); if (error) throw error; }
export function subscribeToNotifications(userIdValue: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`notifications:${userIdValue}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userIdValue}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
