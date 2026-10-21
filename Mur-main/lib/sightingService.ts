// lib/sightingService.ts
import { supabase } from './supabase';
import type { Sighting } from './types';
import { apiError, authenticatedFetch } from './apiClient';

export async function createSighting(
  petId: string,
  { message, place }: { message: string; place: string | null }
): Promise<void> {
  const response = await authenticatedFetch('/api/sightings', { method: 'POST', body: JSON.stringify({ petId, message, place }) });
  if (!response.ok) throw await apiError(response);
}

export async function fetchSightings(petId: string): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from('sightings')
    .select('id,message,place,created_at')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((s): Sighting => ({
    id: s.id,
    message: s.message,
    place: s.place,
    createdAt: s.created_at,
  }));
}
