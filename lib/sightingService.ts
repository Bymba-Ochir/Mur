// lib/sightingService.ts
import { supabase } from './supabase';
import type { Sighting } from './types';

export async function createSighting(
  petId: string,
  { message, place }: { message: string; place: string | null }
): Promise<void> {
  const response = await fetch('/api/sightings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId, message, place }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || 'Харсан тухай мэдээллийг илгээж чадсангүй');
  }
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
