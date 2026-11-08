// lib/sightingService.ts
import { supabase } from './supabase';
import type { Sighting } from './types';
import { apiError, authenticatedFetch } from './apiClient';
import { createIdempotencyKey, idempotencyHeaders } from './idempotency';
import { COMPACT_PAGE_SIZE, finalizePage } from './pagination';
import { sightingPhotoUrl } from './sightingPhoto';
import type { GuestSightingAction, GuestSightingDetails, GuestSightingSummary } from './guestSightings';
import type { PageResult } from './pagination';

function sightingRequestBody(details: Record<string, unknown>, photo?: File) {
  const payload = JSON.stringify(details);
  if (!photo) return payload;
  const form = new FormData();
  form.set('details', payload);
  form.set('photo', photo);
  return form;
}

export async function createSighting(
  petId: string,
  details: Pick<Sighting, 'message' | 'place' | 'lat' | 'lng' | 'sightedAt'>,
  idempotencyKey = createIdempotencyKey(),
  photo?: File,
): Promise<void> {
  const body = sightingRequestBody({ petId, ...details }, photo);
  const response = await authenticatedFetch('/api/sightings', {
    method: 'POST',
    headers: idempotencyHeaders(idempotencyKey),
    body,
  });
  if (!response.ok) throw await apiError(response);
}

export async function createGuestSighting(
  petId: string,
  details: Pick<Sighting, 'message' | 'place' | 'lat' | 'lng' | 'sightedAt'>,
  key: string,
  turnstileToken: string,
  photo?: File,
) {
  const response = await fetch('/api/sightings/guest', {
    method: 'POST',
    headers: photo ? idempotencyHeaders(key) : { 'Content-Type': 'application/json', ...idempotencyHeaders(key) },
    body: sightingRequestBody({ petId, ...details, turnstileToken }, photo),
  });
  if (!response.ok) throw await apiError(response);
}

export async function fetchGuestSightings(petId: string, before?: GuestSightingSummary): Promise<PageResult<GuestSightingSummary>> {
  const params = new URLSearchParams({ petId });
  if (before) {
    params.set('beforeId', before.id);
    params.set('beforeCreated', before.created_at);
  }
  const response = await authenticatedFetch(`/api/sightings/guest/review?${params}`, { cache: 'no-store' });
  if (!response.ok) throw await apiError(response);
  return response.json();
}

export async function reviewGuestSighting(petId: string, id: string, action: GuestSightingAction): Promise<GuestSightingDetails> {
  const response = await authenticatedFetch('/api/sightings/guest/review', {
    method: 'POST',
    body: JSON.stringify({ petId, id, action }),
  });
  if (!response.ok) throw await apiError(response);
  return response.json();
}

export async function fetchGuestSightingPhoto(petId: string, id: string, signal: AbortSignal) {
  const params = new URLSearchParams({ petId, photoId: id });
  const response = await authenticatedFetch(`/api/sightings/guest/review?${params}`, { cache: 'no-store', signal });
  if (!response.ok) throw await apiError(response);
  return response.blob();
}

export async function fetchSightingsPage(petId: string, before?: Pick<Sighting, 'id' | 'createdAt'>) {
  let query = supabase.from('sightings').select('id,message,place,lat,lng,sighted_at,photo_path,created_at,guest_report')
    .eq('pet_id', petId).order('created_at', { ascending: false }).order('id', { ascending: false });
  if (before) {
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(before.id)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(before.createdAt)
      || !Number.isFinite(Date.parse(before.createdAt))) throw new Error('Invalid sighting cursor');
    query = query.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`);
  }
  const { data, error } = await query.limit(COMPACT_PAGE_SIZE + 1);
  if (error) throw error;
  const rows = (data ?? []).map((s): Sighting => ({
    id: s.id, guestReport: s.guest_report, message: s.message, place: s.place, lat: s.lat, lng: s.lng,
    sightedAt: s.sighted_at, photoUrl: sightingPhotoUrl(s.photo_path), createdAt: s.created_at,
  }));
  return finalizePage(rows, 0, COMPACT_PAGE_SIZE);
}

export async function fetchSightings(petId: string): Promise<Sighting[]> {
  return (await fetchSightingsPage(petId)).items;
}

export function subscribeToSightings(petId: string, onChange: () => void): () => void {
  const channel = supabase.channel(`sightings:${petId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sightings', filter: `pet_id=eq.${petId}` }, onChange)
    .subscribe(status => { if (status === 'SUBSCRIBED') onChange(); });
  return () => { void supabase.removeChannel(channel); };
}
