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
  breed?: string;
  color: string;
  place: string;
  district: District;
  phone: string;
  /** "Шагналтай" тэмдэг — нийтэд харагдана */
  hasReward: boolean;
  /** Шагналын дүн (₮) — НУУЦ: нийтэд харуулахгүй, зөвхөн хадгалагдана */
  reward: number | null;
  photoURL: string | null;
  photoURLs?: string[];
  embedding: number[] | null;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
  createdBy: string | null;
  createdAt: string;
  /** rankBySimilarity нэмдэг; DB-ийн шинэ мөрөнд байхгүй */
  similarity?: number;
  /** Зураг, төрөл, үүлдэр, өнгө, байршлыг нэгтгэсэн тохирлын оноо */
  hybridScore?: number;
  matchReasons?: string[];
  embeddingVersion?: string | null;
}

export interface PetReportInput {
  status: PetStatus;
  name: string;
  type: PetType;
  breed: string;
  color: string;
  place: string;
  district: District;
  phone: string;
  hasReward?: boolean;
  reward?: number | null;
  photoFile?: File | null;
  photoFiles?: File[];
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
  photoUrl: string | null;
  age: string | null;
  breed: string | null;
  weight: number | null;
  nextVaccineName: string | null;
  nextVaccineDate: string | null;
  createdAt: string;
}

export type UpdateMyPetFields = Partial<{
  name: string;
  type: string;
  age: string | null;
  breed: string | null;
  weight: number | null;
  nextVaccineName: string | null;
  nextVaccineDate: string | null;
}>;

export interface Vaccination {
  id: string;
  petId: string;
  vaccineName: string;
  vaccinationDate: string;
  vetName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicalCondition {
  id: string;
  petId: string;
  conditionName: string;
  diagnosisDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  nextReminderDate: string | null;
  lastNotifiedDate: string | null;
  createdAt: string;
}

export interface PetHealthData {
  vaccinations: Vaccination[];
  conditions: MedicalCondition[];
  medications: Medication[];
}

export type VetService = 'Үзлэг' | 'Вакцин' | 'Мэс засал' | 'Шүд арчилгаа';

export interface VetClinic {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
  note?: string;
  lat: number;
  lng: number;
  services: VetService[];
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  petId: string | null;
  service: VetService;
  date: string;
  time: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface AppointmentInput {
  clinicId: string;
  petId?: string | null;
  service: VetService;
  date: string;
  time: string;
  notes?: string;
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

// ─── Үрчлүүлэх (Pet Adoption) ───────────────────────────────────────────────

export type AdoptionGender = 'Эрэгтэй' | 'Эмэгтэй' | 'Тодорхойгүй';

export interface Adoption {
  id: string;
  name: string;
  type: PetType;
  age: string;
  gender: AdoptionGender;
  breed: string;
  description: string;
  district: District;
  place: string;
  phone: string;
  photoURL: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface AdoptionInput {
  name: string;
  type: PetType;
  age: string;
  gender: AdoptionGender;
  breed: string;
  description: string;
  place: string;
  district: District;
  phone: string;
  photoFile?: File | null;
}

export interface AdoptionFilters {
  type?: PetType;
  gender?: AdoptionGender;
  district?: District;
  search?: string;
  page?: number;
}

export interface UpdateAdoptionFields {
  name?: string;
  type?: PetType;
  age?: string;
  gender?: AdoptionGender;
  breed?: string;
  description?: string;
  district?: District;
  place?: string;
  phone?: string;
}

// ─── Чат (Real-time messaging) ──────────────────────────────────────────────

export interface Conversation {
  id: string;
  petId: string;
  initiatorId: string;
  ownerId: string;
  initiatorEmail: string;
  ownerEmail: string;
  createdAt: string;
  pet?: ConversationPetSummary | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationPetSummary {
  id: string;
  name: string;
  type: PetType;
  status: PetStatus;
  photoURL: string | null;
  resolved: boolean;
}

export interface ConversationPreview extends Conversation {
  pet: ConversationPetSummary | null;
  lastMessage: Message | null;
}

// ─── Pet Profile (Амьтны сошиал профайл) ────────────────────────────────────

export type PetProfileKind = 'adoption' | 'mypet';

export interface PetProfileData {
  kind: PetProfileKind;
  id: string;
  name: string;
  type: PetType;
  age: string | null;
  breed: string | null;
  gender: AdoptionGender | null;
  weight: number | null;
  description: string | null;
  photoUrl: string | null;
  phone: string | null;
  district: string | null;
  place: string | null;
  createdAt: string;
  isOwner: boolean;
  nextVaccineName?: string | null;
  nextVaccineDate?: string | null;
}

// ─── Pet Sitting (Асрах үйлчилгээ) ─────────────────────────────────────────

export type SittingPetType = PetType | 'Бүгд';

export interface SittingListing {
  id: string;
  userId: string;
  petType: SittingPetType;
  description: string;
  district: District;
  place: string;
  experience: string;
  availability: string;
  phone: string;
  price: number | null;
  photoURL: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export interface SittingListingInput {
  petType: SittingPetType;
  description: string;
  district: District;
  place: string;
  experience: string;
  availability: string;
  phone: string;
  price?: number | null;
  photoFile?: File | null;
  lat?: number | null;
  lng?: number | null;
}

export interface SittingListingFilters {
  petType?: SittingPetType;
  district?: District;
  search?: string;
  page?: number;
}

export interface UpdateSittingListingFields {
  petType?: SittingPetType;
  description?: string;
  district?: District;
  place?: string;
  experience?: string;
  availability?: string;
  phone?: string;
  price?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export interface ConversationSittingSummary {
  id: string;
  petType: SittingPetType;
  district: string;
  place: string;
  photoURL: string | null;
  price: number | null;
}
