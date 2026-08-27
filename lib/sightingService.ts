// lib/sightingService.ts
import { supabase } from './supabase';
import type { Sighting } from './types';

export async function createSighting(
  petId: string,
  { message, place }: { message: string; place: string | null }
): Promise<void> {
  const { error } = await supabase.from('sightings').insert({
    pet_id: petId,
    message,
    place: place || null,
  });
  if (error) throw error;
}

export async function fetchSightings(petId: string): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
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
