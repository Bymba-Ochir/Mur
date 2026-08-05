// lib/types.ts
// Хуваалцсан домэйн төрлүүд. Каноник `Pet` хэлбэр нь lib/petMapping.ts-ийн
// mapPetRow (DB snake_case → camelCase) хэрэглэдэг.
import type { District } from './districts';

export type PetStatus = 'lost' | 'found';
export type PetType = 'Нохой' | 'Муур' | 'Бусад';
export type Locale = 'mn' | 'en';
export type ToastType = 'info' | 'error' | 'success';

export type ShowToast = (message: string, type?: ToastType) => void;

export interface Pet {
  id: string;
  status: PetStatus;
  name: string;
  type: PetType;
  color: string;
  place: string;
  district: District;
  phone: string;
  /** "Шагналтай" тэмдэг — нийтэд харагдана */
  hasReward: boolean;
  /** Шагналын дүн (₮) — НУУЦ: нийтэд харуулахгүй, зөвхөн хадгалагдана */
  reward: number | null;
  photoURL: string | null;
  embedding: number[] | null;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
  createdBy: string | null;
  createdAt: string;
  /** rankBySimilarity нэмдэг; DB-ийн шинэ мөрөнд байхгүй */
  similarity?: number;
}

export interface PetReportInput {
  status: PetStatus;
  name: string;
  type: PetType;
  color: string;
  place: string;
  district: District;
  phone: string;
  hasReward?: boolean;
  reward?: number | null;
  photoFile?: File | null;
  lat?: number | null;
  lng?: number | null;
}

export interface PetFilters {
  status?: PetStatus;
  type?: PetType;
  district?: District;
  search?: string;
  includeResolved?: boolean;
  page?: number;
}

export interface UpdatePetFields {
  name?: string;
  color?: string;
  place?: string;
  district?: District;
  phone?: string;
}

export interface Sighting {
  id: string;
  message: string;
  place: string | null;
  createdAt: string;
}

export type VaccineStatus = 'overdue' | 'soon' | 'ok' | 'none';

export interface MyPet {
  id: string;
  name: string;
  type: string;
  nextVaccineDate: string | null;
  createdAt: string;
}

export interface ReportPet {
  id: string;
  status: PetStatus;
  name: string;
  type: PetType;
  photoURL: string | null;
  district: District;
  place: string;
}

export interface Report {
  id: string;
  reason: string;
  createdAt: string;
  pet: ReportPet | null;
}

/** Discriminated union: ok=false бол reason нь string гэдэг нь баталгаатай */
export type CheckImageResult =
  | { ok: true; warning?: string }
  | { ok: false; reason: string };

export interface QPayInvoiceInput {
  sender_invoice_no: string;
  invoice_description: string;
  amount: number;
  callback_url: string;
}

export interface QPayInvoice {
  invoice_id: string;
  qr_image: string;
  qr_text: string;
  urls?: { name: string; description: string; logo?: string; link: string }[];
}
