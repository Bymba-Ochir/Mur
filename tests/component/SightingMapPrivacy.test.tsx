import { render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { LocationMapPin } from '../../components/LocationMap';
import type { GuestSightingDetails } from '../../lib/guestSightings';
import type { Sighting } from '../../lib/types';
const received = vi.hoisted(() => ({ pins: [] as LocationMapPin[] }));
vi.mock('../../components/LocationMap', () => ({ default: ({ pins }: { pins: LocationMapPin[] }) => { received.pins = pins; return <div />; } }));
vi.mock('../../lib/i18n', () => ({ useLanguage: () => ({ lang: 'mn', t: (key: string) => key }) }));
import PetSightingsMap from '../../components/PetSightingsMap';

const guest: Sighting = {
  id: 'guest', guestReport: true, message: 'Private message', place: 'Private address',
  lat: 47.92, lng: 106.92, sightedAt: '2026-11-15T10:40:00Z', photoUrl: null, createdAt: '2026-11-15T11:00:00Z',
};
const privateReport: GuestSightingDetails = {
  id: 'guest', state: 'published', created_at: guest.createdAt, first_viewed_at: null, useful_at: null,
  message: guest.message, place: guest.place, lat: 47.918, lng: 106.917, sighted_at: guest.sightedAt,
  hasPhoto: false, photo_share_allowed: false, photoPublic: false,
};
beforeEach(() => { received.pins = []; });

it('keeps exact guest timestamps and addresses out of public labels and popups', () => {
  render(<PetSightingsMap sightings={[guest]} focus={null} privateSighting={privateReport} />);
  expect(received.pins).toHaveLength(1);
  expect(received.pins[0].timeLabel).toBeUndefined();
  const publicContent = JSON.stringify(received.pins[0].details);
  expect(publicContent).not.toContain(guest.message);
  expect(publicContent).not.toContain(guest.place);
  expect(publicContent).not.toContain('18:40');
  expect(received.pins[0].lat).toBe(guest.lat);
});

it('shows the selected private observation time only in the owner map', () => {
  render(<PetSightingsMap sightings={[guest]} focus={null} ownerPetId="pet" privateSighting={privateReport} />);
  expect(received.pins).toHaveLength(1);
  expect(received.pins[0].id).toBe('guest:guest');
  expect(received.pins[0].timeLabel?.observedAt).toBe(privateReport.sighted_at);
  expect(received.pins[0].lat).toBe(privateReport.lat);
  expect(received.pins[0].details[0].message).toBe(guest.message);
});

it('groups overlapping public reports and labels the latest observation rather than the upload time', () => {
  const older = { ...guest, guestReport: false, id: 'older', sightedAt: '2026-11-15T00:10:00Z' };
  const newer = { ...older, id: 'newer', sightedAt: '2026-11-15T10:40:00Z' };
  render(<PetSightingsMap sightings={[newer, older]} focus={null} />);
  expect(received.pins).toHaveLength(1);
  expect(received.pins[0].details).toHaveLength(2);
  expect(received.pins[0].timeLabel?.observedAt).toBe(newer.sightedAt);
});
