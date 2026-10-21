// lib/sittingService.ts
// Асрах үйлчилгээний CRUD
import { supabase } from './supabase';
import type { SittingListing, SittingListingInput, SittingListingFilters, UpdateSittingListingFields } from './types';
import { cleanText, optionalCoordinate, optionalInteger, requireMongolianPhone } from './inputValidation';
import { apiError, authenticatedFetch } from './apiClient';
import { createIdempotencyKey, idempotentFileName, isIdempotencyKey } from './idempotency';
import { DEFAULT_PAGE_SIZE, finalizePage, pageWindow } from './pagination';

const TABLE = 'sitting_listings';
const BUCKET = 'pet-photos';

// ─── Маппинг ────────────────────────────────────────────────────────────────

interface SittingRow {
  id: string;
  user_id: string;
  pet_type: string | null;
  description: string | null;
  district: string | null;
  place: string | null;
  experience: string | null;
  availability: string | null;
  phone: string | null;
  price: number | null;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

function mapSittingRow(row: SittingRow): SittingListing {
  return {
    id: row.id,
    userId: row.user_id,
    petType: (row.pet_type ?? 'Нохой') as SittingListing['petType'],
    description: row.description ?? '',
    district: (row.district ?? '') as SittingListing['district'],
    place: row.place ?? '',
    experience: row.experience ?? '',
    availability: row.availability ?? '',
    phone: row.phone ?? '',
    price: row.price ?? null,
    photoURL: row.photo_url,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    createdAt: row.created_at,
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return user.id;
}

export async function createSittingListing(data: SittingListingInput, mutationId = createIdempotencyKey()): Promise<string> {
  const userId = await requireUserId();
  if (!isIdempotencyKey(mutationId)) throw new Error('Үйлдлийн дугаар буруу байна.');

  const { data: existing, error: existingError } = await supabase.from(TABLE).select('id,user_id').eq('id', mutationId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.user_id !== userId) throw new Error('Үйлдлийн дугаар давхардлаа. Дахин оролдоно уу.');
    return existing.id;
  }

  const price = optionalInteger(data.price, { min: 0, max: 100_000_000, label: 'Үйлчилгээний үнэ' });
  let photoUrl: string | null = null;

  if (data.photoFile) {
    const path = `${userId}/sitting/${idempotentFileName(mutationId, 0, data.photoFile.name)}`;
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, data.photoFile);
    if (uploadErr && !/already exists|duplicate|resource already exists/i.test(uploadErr.message)) throw uploadErr;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    photoUrl = urlData.publicUrl;
  }

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert({
      id: mutationId,
      user_id: userId,
      pet_type: data.petType,
      description: cleanText(data.description, 2000, 'Тайлбар', true),
      district: data.district || '',
      place: cleanText(data.place, 300, 'Байршил', true),
      experience: cleanText(data.experience, 500, 'Туршлага'),
      availability: cleanText(data.availability, 500, 'Боломжит цаг'),
      phone: requireMongolianPhone(data.phone),
      price,
      photo_url: photoUrl,
      lat: optionalCoordinate(data.lat, 'lat'),
      lng: optionalCoordinate(data.lng, 'lng'),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: raced, error: racedError } = await supabase.from(TABLE).select('id,user_id').eq('id', mutationId).maybeSingle();
      if (racedError) throw racedError;
      if (raced?.user_id === userId) return raced.id;
    }
    if (error.message?.includes('RATE_LIMIT:')) {
      throw new Error('Хэт олон зар нийтлээ. 1 цагийн дараа дахин оролдоно уу.');
    }
    throw error;
  }
  return inserted.id;
}

export async function fetchSittingListingById(id: string): Promise<SittingListing> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return mapSittingRow(data);
}

export async function fetchSittingListings(filters: SittingListingFilters = {}): Promise<{ listings: SittingListing[]; hasMore: boolean }> {
  const { petType, district, search, page = 0 } = filters;
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

  if (petType) q = q.eq('pet_type', petType);
  if (district) q = q.eq('district', district);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%_]/g, '');
    q = q.or(`description.ilike.%${s}%,place.ilike.%${s}%,experience.ilike.%${s}%,district.ilike.%${s}%`);
  }

  const window = pageWindow(page, DEFAULT_PAGE_SIZE);
  q = q.range(window.from, window.to);

  const { data, error } = await q;
  if (error) throw error;

  const result = finalizePage(data, window.page, window.pageSize);
  return { listings: result.items.map(mapSittingRow), hasMore: result.hasMore };
}

export async function updateSittingListing(id: string, fields: UpdateSittingListingFields): Promise<void> {
  const userId = await requireUserId();
  const updateData: Record<string, unknown> = {};
  if (fields.petType !== undefined) updateData.pet_type = fields.petType;
  if (fields.description !== undefined) updateData.description = cleanText(fields.description, 2000, 'Тайлбар', true);
  if (fields.district !== undefined) updateData.district = fields.district;
  if (fields.place !== undefined) updateData.place = cleanText(fields.place, 300, 'Байршил', true);
  if (fields.experience !== undefined) updateData.experience = cleanText(fields.experience, 500, 'Туршлага');
  if (fields.availability !== undefined) updateData.availability = cleanText(fields.availability, 500, 'Боломжит цаг');
  if (fields.phone !== undefined) updateData.phone = requireMongolianPhone(fields.phone);
  if (fields.price !== undefined) updateData.price = optionalInteger(fields.price, { min: 0, max: 100_000_000, label: 'Үйлчилгээний үнэ' });
  if (fields.lat !== undefined) updateData.lat = optionalCoordinate(fields.lat, 'lat');
  if (fields.lng !== undefined) updateData.lng = optionalCoordinate(fields.lng, 'lng');

  const { error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteSittingListing(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/content/sitting/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw await apiError(response);
}
