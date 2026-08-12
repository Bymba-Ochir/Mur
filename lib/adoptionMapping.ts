// lib/adoptionMapping.ts
// Supabase-ийн DB мөр (snake_case) → домэйн объект (camelCase) маппинг.
import type { Adoption, AdoptionGender } from './types';

interface AdoptionRow {
  id: string;
  name: string | null;
  type: string;
  age: string | null;
  gender: string | null;
  breed: string | null;
  description: string | null;
  district: string | null;
  place: string | null;
  phone: string | null;
  photo_url: string | null;
  photo_urls?: unknown;
  created_by: string | null;
  created_at: string;
}

export function mapAdoptionRow(row: AdoptionRow): Adoption {
  return {
    id: row.id,
    name: row.name ?? '',
    type: row.type as Adoption['type'],
    age: row.age ?? '',
    gender: (row.gender ?? 'Тодорхойгүй') as AdoptionGender,
    breed: row.breed ?? '',
    description: row.description ?? '',
    district: (row.district ?? '') as Adoption['district'],
    place: row.place ?? '',
    phone: row.phone ?? '',
    photoURL: row.photo_url,
    photoURLs: Array.isArray(row.photo_urls)
      ? row.photo_urls.filter((url): url is string => typeof url === 'string')
      : row.photo_url ? [row.photo_url] : [],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
