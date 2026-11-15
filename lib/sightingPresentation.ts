import type { Sighting } from './types';
import { dateTimeFormat } from './dateTime';

export function guestSightingMapPinId(reportId: string): string {
  return `guest:${reportId}`;
}

export function sightingMapPinId({ lat, lng }: Pick<Sighting, 'lat' | 'lng'>): string | null {
  return lat != null && lng != null ? `${lat}:${lng}` : null;
}

export type SightingMapTimeLabel = { text: string; title: string; observedAt: string };

/** Public guest summaries never expose the private observation time. */
export function sightingMapTimeLabel(
  sighting: Pick<Sighting, 'guestReport' | 'sightedAt'>,
  lang: 'mn' | 'en',
  seenLabel: string,
  now = new Date(),
): SightingMapTimeLabel | undefined {
  if (sighting.guestReport || !sighting.sightedAt) return;
  const date = new Date(sighting.sightedAt);
  if (!Number.isFinite(date.getTime())) return;
  const two = (value: number) => String(value).padStart(2, '0');
  const sameYear = date.getFullYear() === now.getFullYear();
  const sameDay = sameYear && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  const day = `${sameYear ? '' : `${date.getFullYear()}.`}${two(date.getMonth() + 1)}.${two(date.getDate())} `;
  const time = `${two(date.getHours())}:${two(date.getMinutes())}`;
  return {
    text: `${sameDay ? '' : day}${time} · ${seenLabel}`,
    title: `${seenLabel}: ${dateTimeFormat(lang).format(date)}`,
    observedAt: sighting.sightedAt,
  };
}

export function isRecentSighting(createdAt?: string, now = Date.now()): boolean {
  if (!createdAt) return false;
  const age = now - Date.parse(createdAt);
  return Number.isFinite(age) && age >= 0 && age <= 5 * 60_000;
}

