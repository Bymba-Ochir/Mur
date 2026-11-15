import { describe, expect, it } from 'vitest';
import { isRecentSighting, sightingMapTimeLabel } from '../../lib/sightingPresentation';

const now = new Date(2026, 10, 15, 20);
const observed = new Date(2026, 10, 15, 8, 10).toISOString();

describe('sighting map time labels', () => {
  it('shows the observation time in a compact 24-hour label, with a full date available', () => {
    expect(sightingMapTimeLabel({ sightedAt: observed }, 'mn', 'Харсан', now)).toEqual({
      text: '08:10 · Харсан', title: 'Харсан: 2026.11.15 08:10', observedAt: observed,
    });
  });
  it('includes the date for older observations so yesterday cannot look like today', () => {
    const yesterday = new Date(2026, 10, 14, 18, 40).toISOString();
    expect(sightingMapTimeLabel({ sightedAt: yesterday }, 'en', 'Seen', now)?.text).toBe('11.14 18:40 · Seen');
    const previousYear = new Date(2025, 10, 15, 18, 40).toISOString();
    expect(sightingMapTimeLabel({ sightedAt: previousYear }, 'mn', 'Харсан', now)?.text).toBe('2025.11.15 18:40 · Харсан');
  });
  it('never puts a private guest observation time into a public map label', () => {
    expect(sightingMapTimeLabel({ guestReport: true, sightedAt: observed }, 'mn', 'Харсан', now)).toBeUndefined();
  });
  it('does not invent an observation time when it is missing or invalid', () => {
    expect(sightingMapTimeLabel({ sightedAt: null }, 'mn', 'Харсан', now)).toBeUndefined();
    expect(sightingMapTimeLabel({ sightedAt: 'invalid' }, 'mn', 'Харсан', now)).toBeUndefined();
  });
  it('highlights recent reports without treating old or future timestamps as new arrivals', () => {
    const time = now.getTime();
    expect(isRecentSighting(new Date(time - 120_000).toISOString(), time)).toBe(true);
    expect(isRecentSighting(new Date(time - 360_000).toISOString(), time)).toBe(false);
    expect(isRecentSighting(new Date(time + 1).toISOString(), time)).toBe(false);
    expect(isRecentSighting('invalid', time)).toBe(false);
    expect(isRecentSighting(undefined, time)).toBe(false);
  });
});
