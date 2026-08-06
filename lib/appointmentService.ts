// lib/appointmentService.ts
// Мал эмнэлгийн цаг захиалгын CRUD
import { supabase } from './supabase';
import type { Appointment, AppointmentInput, AppointmentStatus } from './types';

const TABLE = 'appointments';

// ─── Маппинг ────────────────────────────────────────────────────────────────

function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clinicId: row.clinic_id as string,
    petId: (row.pet_id as string) ?? null,
    service: row.service as Appointment['service'],
    date: row.date as string,
    time: row.time_slot as string,
    notes: (row.notes as string) ?? null,
    status: row.status as AppointmentStatus,
    createdAt: row.created_at as string,
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return user.id;
}

/**
 * Цаг захиалах
 */
export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      clinic_id: input.clinicId,
      pet_id: input.petId || null,
      service: input.service,
      date: input.date,
      time_slot: input.time,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAppointmentRow(data);
}

/**
 * Миний захиалгуудыг татах
 */
export async function fetchMyAppointments(): Promise<Appointment[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('time_slot', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapAppointmentRow);
}

/**
 * Захиалгыг цуцлах
 */
export async function cancelAppointment(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Захиалгыг устгах
 */
export async function deleteAppointment(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Тусламжит ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: '⏳ Хүлээгдэж байна',
  confirmed: '✅ Баталгаажсан',
  completed: '🏁 Хийгдсэн',
  cancelled: '❌ Цуцалсан',
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status];
}

/** Цагийн слотууд (30 минутын алхам) */
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00',
];
