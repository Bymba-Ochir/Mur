// lib/petMapping.ts
// Supabase-ийн DB мөр (snake_case) → домэйн объект (camelCase) маппинг.
// fetchPetById / fetchPets / adminService-д давхардаж байсан логикийг нэгтгэсэн.
import type { Pet, ReportPet } from './types';

// pets хүснэгтийн мөр. Generated types байхгүй тул шаардлагатай талбаруудыг
// сонгон авна (null-able талбарууд DB-ийн default-той нийцнэ).
interface PetRow {
  id: string;
  status: string;
  name: string | null;
  type: string;
  breed: string | null;
  color: string | null;
  place: string | null;
  district: string | null;
  phone: string | null;
  has_reward: boolean | null;
  reward: number | null;
  photo_url: string | null;
  color_signature: unknown; // CLIP vector (JSONB)
  lat: number | null;
  lng: number | null;
  resolved: boolean | null;
  created_by: string | null;
  created_at: string;
  embedding_version?: string | null;
}

export function mapPetRow(row: PetRow): Pet {
  return {
    id: row.id,
    status: row.status as Pet['status'],
    name: row.name ?? '',
    type: row.type as Pet['type'],
    breed: row.breed ?? '',
    color: row.color ?? '',
    place: row.place ?? '',
    district: (row.district ?? '') as Pet['district'],
    phone: row.phone ?? '',
    hasReward: row.has_reward ?? false,
    reward: row.reward ?? null,
    photoURL: row.photo_url,
    embedding: (row.color_signature as number[] | null) ?? null,
    lat: row.lat,
    lng: row.lng,
    resolved: row.resolved ?? false,
    createdBy: row.created_by,
    createdAt: row.created_at,
    embeddingVersion: row.embedding_version ?? null,
  };
}

/** Admin жагсаалтад хэрэглэгддэг багасгасан pet мэдээлэл */
export function mapPetSummary(row: PetRow): ReportPet {
  return {
    id: row.id,
    status: row.status as Pet['status'],
    name: row.name ?? '',
    type: row.type as Pet['type'],
    photoURL: row.photo_url,
    district: (row.district ?? '') as Pet['district'],
    place: row.place ?? '',
  };
}
