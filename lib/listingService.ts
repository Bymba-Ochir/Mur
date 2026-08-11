'use client';
import { supabase } from './supabase';
import { mapPetRow } from './petMapping';
import type { Pet, PetStatus, PetType } from './types';
import type { District } from './districts';

export interface SavedSearch {
  id: string; name: string; status: PetStatus | null; petType: PetType | null;
  district: District | null; searchText: string | null; notify: boolean;
}

export interface ListingNotification {
  id: string;
  petId: string;
  title: string;
  read: boolean;
  createdAt: string;
}

export async function toggleFavorite(petId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_pet_favorite', { target_pet: petId });
  if (error) throw error;
  return Boolean(data);
}

export async function isFavorite(petId: string): Promise<boolean> {
  const { data } = await supabase.from('pet_favorites').select('pet_id').eq('pet_id', petId).maybeSingle();
  return Boolean(data);
}

export async function fetchFavorites(): Promise<Pet[]> {
  const { data, error } = await supabase.from('pet_favorites').select('pet:pets(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row: any) => row.pet ? [mapPetRow(row.pet)] : []);
}

export async function incrementPetView(petId: string): Promise<void> {
  await supabase.rpc('increment_pet_view', { target_pet: petId });
}

export async function renewPetListing(petId: string): Promise<void> {
  const { error } = await supabase.rpc('renew_pet_listing', { target_pet: petId });
  if (error) throw error;
}

export async function saveSearch(input: { status?: PetStatus; petType?: PetType; district?: District; searchText?: string }): Promise<void> {
  const { error } = await supabase.from('saved_searches').insert({
    name: [input.status === 'lost' ? 'Алдсан' : input.status === 'found' ? 'Олдсон' : '', input.petType, input.district].filter(Boolean).join(' · ') || 'Хадгалсан хайлт',
    status: input.status ?? null, pet_type: input.petType ?? null, district: input.district ?? null, search_text: input.searchText || null,
  });
  if (error) throw error;
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const { data, error } = await supabase.from('saved_searches').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, status: row.status, petType: row.pet_type, district: row.district, searchText: row.search_text, notify: row.notify }));
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const { error } = await supabase.from('saved_searches').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchListingNotifications(): Promise<ListingNotification[]> {
  const { data, error } = await supabase
    .from('listing_notifications')
    .select('id,pet_id,title,read,created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    petId: row.pet_id,
    title: row.title,
    read: row.read,
    createdAt: row.created_at,
  }));
}

export async function markListingNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('listing_notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}
