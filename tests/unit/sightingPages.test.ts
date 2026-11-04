import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() } }));
vi.mock('../../lib/apiClient', () => ({ authenticatedFetch: vi.fn() }));
import { supabase } from '../../lib/supabase';
import { fetchSightingsPage, subscribeToSightings } from '../../lib/sightingService';
const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), limit: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>); });
it('reads only 21 rows and preserves timestamp precision in a stable keyset cursor', async () => {
  query.limit.mockResolvedValue({ data: Array.from({ length: 21 }, (_, n) => ({ id: `id-${n}`, created_at: '2026-11-04T01:02:03.123456+00:00', message: 'Seen', place: '' })), error: null });
  const page = await fetchSightingsPage('pet'); expect(page.items).toHaveLength(20); expect(page.hasMore).toBe(true);
  expect(query.limit).toHaveBeenCalledWith(21);
  const cursor = { id: '93c0a77d-f012-4c08-b4a3-bc0982b370fd', createdAt: '2026-11-04T01:02:03.123456+00:00' };
  await fetchSightingsPage('pet', cursor);
  expect(query.or).toHaveBeenCalledWith(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
});
it('rejects malformed cursors before constructing a PostgREST filter', async () => {
  await expect(fetchSightingsPage('pet', { id: 'bad),id.gt.0', createdAt: '2026-11-04T00:00:00Z' })).rejects.toThrow('Invalid sighting cursor');
  expect(query.or).not.toHaveBeenCalled(); expect(query.limit).not.toHaveBeenCalled();
});
it('invalidates after reconnect and removes its filtered subscription on unmount', () => {
  const changed = vi.fn(); let onStatus: (status: string) => void = () => {};
  const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn(callback => { onStatus = callback; return channel; }) };
  vi.mocked(supabase.channel).mockReturnValue(channel as unknown as ReturnType<typeof supabase.channel>);
  const stop = subscribeToSightings('pet', changed);
  expect(channel.on).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({ filter: 'pet_id=eq.pet' }), changed);
  onStatus('SUBSCRIBED'); expect(changed).toHaveBeenCalledOnce(); stop(); expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
});
