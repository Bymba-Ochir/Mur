'use client';
import { supabase } from './supabase';
import { cleanText } from './inputValidation';
import { mapPetRow } from './petMapping';
import type { PetRow } from './petMapping';
import type { Pet, PetStatus, PetType } from './types';
import type { District } from './districts';
import type { AppNotification } from './workflowService';
import { hydrateListingPhotos } from './photoRepository';

export interface SavedSearch { id: string; name: string; status: PetStatus | null; petType: PetType | null; district: District | null; searchText: string | null; notify: boolean; createdAt: string; }
interface FavoriteRow { pet: PetRow | PetRow[] | null; }

async function requireUserId(): Promise<string> { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Эхлээд нэвтэрнэ үү.'); return user.id; }

export async function toggleFavorite(petId: string): Promise<boolean> { await requireUserId(); const { data, error } = await supabase.rpc('toggle_pet_favorite', { target_pet: petId }); if (error) throw error; return Boolean(data); }
export async function isFavorite(petId: string): Promise<boolean> { await requireUserId(); const { data, error } = await supabase.from('pet_favorites').select('pet_id').eq('pet_id', petId).maybeSingle(); if (error) throw error; return Boolean(data); }
export async function fetchFavorites(): Promise<Pet[]> {
  await requireUserId();
  const { data, error } = await supabase.from('pet_favorites').select('pet:pets(*)').order('created_at', { ascending: false });
  if (error) throw error;
  const rows = ((data ?? []) as FavoriteRow[]).flatMap((row) => {
    const pet = Array.isArray(row.pet) ? row.pet[0] : row.pet;
    return pet ? [pet] : [];
  });
  const hydrated = await hydrateListingPhotos('pet', rows);
  return hydrated.map(mapPetRow);
}

export async function saveSearch(input: { status?: PetStatus; petType?: PetType; district?: District; searchText?: string }): Promise<void> {
  const userId = await requireUserId();
  const searchText = cleanText(input.searchText, 100, 'Хайлтын үг') || null;
  const name = [input.status === 'lost' ? 'Алдсан' : input.status === 'found' ? 'Олдсон' : '', input.petType, input.district, searchText].filter(Boolean).join(' · ') || 'Бүх зар';
  const { error } = await supabase.from('saved_searches').insert({ user_id: userId, name, status: input.status ?? null, pet_type: input.petType ?? null, district: input.district ?? null, search_text: searchText, notify: true });
  if (error?.code === '23505') throw new Error('Энэ хайлтыг өмнө нь хадгалсан байна.');
  if (error) throw error;
}
export async function fetchSavedSearches(): Promise<SavedSearch[]> { await requireUserId(); const { data, error } = await supabase.from('saved_searches').select('*').order('created_at', { ascending: false }); if (error) throw error; return (data ?? []).map((row) => ({ id: row.id, name: row.name, status: row.status, petType: row.pet_type, district: row.district, searchText: row.search_text, notify: row.notify, createdAt: row.created_at })); }
export async function deleteSavedSearch(id: string): Promise<void> { await requireUserId(); const { error } = await supabase.from('saved_searches').delete().eq('id', id); if (error) throw error; }
export async function fetchSavedSearchNotifications(): Promise<AppNotification[]> { await requireUserId(); const { data, error } = await supabase.from('notifications').select('*').eq('type', 'saved_search').order('created_at', { ascending: false }).limit(50); if (error) throw error; return (data ?? []).map((row) => ({ id: row.id, type: row.type, title: row.title, body: row.body, href: row.href, readAt: row.read_at, createdAt: row.created_at })); }
