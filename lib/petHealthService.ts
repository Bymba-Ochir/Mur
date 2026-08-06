// lib/petHealthService.ts
// Амьтны эрүүл мэндийн үйлчилгээ: вакцин, өвчин, эмийн CRUD
import { supabase } from './supabase';
import type { Vaccination, MedicalCondition, Medication, PetHealthData } from './types';

// ─── Тусламжит функцууд ──────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return user.id;
}

// ─── Маппинг ─────────────────────────────────────────────────────────────────

function mapVaccinationRow(row: Record<string, unknown>): Vaccination {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    vaccineName: row.vaccine_name as string,
    vaccinationDate: row.vaccination_date as string,
    vetName: (row.vet_name as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapConditionRow(row: Record<string, unknown>): MedicalCondition {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    conditionName: row.condition_name as string,
    diagnosisDate: (row.diagnosis_date as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapMedicationRow(row: Record<string, unknown>): Medication {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    name: row.name as string,
    dosage: (row.dosage as string) ?? null,
    frequency: (row.frequency as string) ?? null,
    startDate: (row.start_date as string) ?? null,
    endDate: (row.end_date as string) ?? null,
    nextReminderDate: (row.next_reminder_date as string) ?? null,
    lastNotifiedDate: (row.last_notified_date as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ─── Амьтны эрүүл мэндийн бүх мэдээллийг татах ──────────────────────────────

export async function fetchPetHealth(petId: string): Promise<PetHealthData> {
  const userId = await requireUserId();

  // Эзэмшлийг шалгах
  const { data: pet } = await supabase
    .from('my_pets')
    .select('id')
    .eq('id', petId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!pet) throw new Error('Амьтан олдсонгүй');

  const [vaxRes, condRes, medRes] = await Promise.all([
    supabase.from('vaccinations').select('*').eq('pet_id', petId).order('vaccination_date', { ascending: false }),
    supabase.from('medical_conditions').select('*').eq('pet_id', petId).order('diagnosis_date', { ascending: false }),
    supabase.from('medications').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
  ]);

  return {
    vaccinations: (vaxRes.data ?? []).map(mapVaccinationRow),
    conditions: (condRes.data ?? []).map(mapConditionRow),
    medications: (medRes.data ?? []).map(mapMedicationRow),
  };
}

// ─── Вакцин ──────────────────────────────────────────────────────────────────

export async function addVaccination(petId: string, input: {
  vaccineName: string;
  vaccinationDate: string;
  vetName?: string;
  notes?: string;
}): Promise<Vaccination> {
  const { data, error } = await supabase
    .from('vaccinations')
    .insert({
      pet_id: petId,
      vaccine_name: input.vaccineName,
      vaccination_date: input.vaccinationDate,
      vet_name: input.vetName || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapVaccinationRow(data);
}

export async function deleteVaccination(id: string): Promise<void> {
  const { error } = await supabase.from('vaccinations').delete().eq('id', id);
  if (error) throw error;
}

// ─── Өвчин ───────────────────────────────────────────────────────────────────

export async function addCondition(petId: string, input: {
  conditionName: string;
  diagnosisDate?: string;
  notes?: string;
}): Promise<MedicalCondition> {
  const { data, error } = await supabase
    .from('medical_conditions')
    .insert({
      pet_id: petId,
      condition_name: input.conditionName,
      diagnosis_date: input.diagnosisDate || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapConditionRow(data);
}

export async function deleteCondition(id: string): Promise<void> {
  const { error } = await supabase.from('medical_conditions').delete().eq('id', id);
  if (error) throw error;
}

// ─── Эм ──────────────────────────────────────────────────────────────────────

export async function addMedication(petId: string, input: {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  nextReminderDate?: string;
}): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      pet_id: petId,
      name: input.name,
      dosage: input.dosage || null,
      frequency: input.frequency || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      next_reminder_date: input.nextReminderDate || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMedicationRow(data);
}

export async function updateMedicationReminder(id: string, nextReminderDate: string): Promise<void> {
  const { error } = await supabase
    .from('medications')
    .update({ next_reminder_date: nextReminderDate, last_notified_date: null })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase.from('medications').delete().eq('id', id);
  if (error) throw error;
}
