// lib/clinicService.ts
// Мал эмнэлгийн газрын байршил, хайх, ойролцоох функцууд
import { VET_CLINICS } from './vetClinics';
import { supabase } from './supabase';
import type { VetClinic, VetService } from './types';

/**
 * Haversine formulas — хоёр цэгийн хоорондын зай (км)
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type ClinicWithDistance = VetClinic & { distanceKm: number };

export async function fetchPublicClinics(): Promise<VetClinic[]> {
  const { data, error } = await supabase.from('vet_clinics').select('*').eq('is_active', true).order('name');
  if (error || !data || data.length === 0) return VET_CLINICS;
  return data.map((x) => ({
    id: x.id, name: x.name, district: x.district, address: x.address,
    phone: x.phone, hours: x.hours, note: x.note || undefined,
    lat: x.lat, lng: x.lng, services: x.services as VetService[],
  }));
}

/**
 * Хамгийн ойр N эмнэлгийг haversine-аар эрэмбэлээд буцаана
 */
export function findNearestClinics(
  lat: number,
  lng: number,
  clinics: VetClinic[] = VET_CLINICS,
  limit = 5,
): ClinicWithDistance[] {
  return clinics
    .map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Дүүрэг, үйлчилгээ, нэрээр шүүнэ
 */
export function searchClinics(opts: {
  district?: string;
  service?: VetService | '';
  query?: string;
}, clinics: VetClinic[] = VET_CLINICS): VetClinic[] {
  let result = [...clinics];

  if (opts.district) {
    result = result.filter((c) => c.district === opts.district);
  }
  if (opts.service) {
    const svc = opts.service as VetService;
    result = result.filter((c) => c.services.includes(svc));
  }
  if (opts.query && opts.query.trim()) {
    const q = opts.query.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }

  return result;
}

/**
 * Зайг хүндрүүлэгч тэмдэглэгээ
 */
export function distanceLabel(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
}
