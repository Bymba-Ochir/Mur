// lib/sightingService.js
import { supabase } from './supabase';

export async function createSighting(petId, { message, place }) {
  const { error } = await supabase.from('sightings').insert({
    pet_id: petId,
    message,
    place: place || null,
  });
  if (error) throw error;
}

export async function fetchSightings(petId) {
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((s) => ({
    id: s.id,
    message: s.message,
    place: s.place,
    createdAt: s.created_at,
  }));
}
