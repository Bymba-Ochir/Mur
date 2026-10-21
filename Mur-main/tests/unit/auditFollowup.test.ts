import { describe, it, expect, vi, afterEach } from 'vitest';
import { relativeTime } from '../../lib/relativeTime';
import { listingReturnPath, parseListingFilters } from '../../lib/useListingFilters';
afterEach(() => vi.useRealTimers());
describe('audit followup', () => {
 it('formats singular and plural weeks and months', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-09T00:00:00Z'));
  expect(relativeTime('2026-08-09T00:00:00Z', 'en')).toBe('1 month ago');
  expect(relativeTime('2026-09-02T00:00:00Z', 'en')).toBe('1 week ago');
  expect(relativeTime('2026-08-26T00:00:00Z', 'en')).toBe('2 weeks ago');
 });
 it('preserves internal filters without accepting external navigation', () => {
  expect(listingReturnPath('?returnTo=' + encodeURIComponent('/listings?status=found&q=Lucky'), '/listings')).toBe('/listings?status=found&q=Lucky');
  expect(listingReturnPath('?returnTo=https://example.com', '/listings')).toBe('/listings');
  expect(listingReturnPath('?returnTo=//example.com', '/adoptions')).toBe('/adoptions');
 });
 it('validates adoption gender from URL', () => {
  expect(parseListingFilters('?gender=' + encodeURIComponent('Эрэгтэй')).gender).toBe('Эрэгтэй');
  expect(parseListingFilters('?gender=invalid').gender).toBe('');
 });
});
