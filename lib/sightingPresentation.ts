import type { Sighting } from './types';

export function sightingMapPinId({ lat, lng }: Pick<Sighting, 'lat' | 'lng'>): string | null {
  return lat != null && lng != null ? `${lat}:${lng}` : null;
}

export function sightingDateTimeFormat(lang: 'mn' | 'en') {
  const formatter = new Intl.DateTimeFormat(lang === 'mn' ? 'en-GB' : 'en', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  if (lang === 'en') return formatter;

  // Numeric Mongolian dates stay consistent even when the browser lacks mn-MN.
  return {
    format(date: Date) {
      const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
      return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
    },
  };
}
