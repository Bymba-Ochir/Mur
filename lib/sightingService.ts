// lib/sightingService.ts
import { supabase } from './supabase';
import type { Sighting } from './types';
import { apiError, authenticatedFetch } from './apiClient';
import { createIdempotencyKey, idempotencyHeaders } from './idempotency';
import { COMPACT_PAGE_SIZE, finalizePage } from './pagination';
import { sightingPhotoUrl } from './sightingPhoto';

export async function createSighting(
  petId: string,
  details: Pick<Sighting, 'message' | 'place' | 'lat' | 'lng' | 'sightedAt'>,
  idempotencyKey = createIdempotencyKey(),
  photo?: File,
): Promise<void> {
  const payload = JSON.stringify({ petId, ...details });
  let body: string | FormData = payload;
  if (photo) {
    body = new FormData();
    body.set('details', payload);
    body.set('photo', photo);
  }
  const response = await authenticatedFetch('/api/sightings', {
    method: 'POST',
    headers: idempotencyHeaders(idempotencyKey),
    body,
  });
  if (!response.ok) throw await apiError(response);
}

export async function fetchSightingsPage(petId: string, before?: Pick<Sighting, 'id' | 'createdAt'>) {
  let query = supabase.from('sightings').select('id,message,place,lat,lng,sighted_at,photo_path,created_at')
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
    id: s.id, message: s.message, place: s.place, lat: s.lat, lng: s.lng,
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
