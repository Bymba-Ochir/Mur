import type { Sighting } from './types';

export function sightingMapPinId({ lat, lng }: Pick<Sighting, 'lat' | 'lng'>): string | null {
  return lat != null && lng != null ? `${lat}:${lng}` : null;
}

export function sightingDateTimeFormat(lang: 'mn' | 'en') {
  return new Intl.DateTimeFormat(lang === 'mn' ? 'mn-MN' : 'en', {
    dateStyle: 'medium', timeStyle: 'short',
  });
}
