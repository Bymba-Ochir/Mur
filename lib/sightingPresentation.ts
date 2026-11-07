import type { Sighting } from './types';

export function sightingMapPinId({ lat, lng }: Pick<Sighting, 'lat' | 'lng'>): string | null {
  return lat != null && lng != null ? `${lat}:${lng}` : null;
}

