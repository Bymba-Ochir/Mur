import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: mocks }));
vi.mock('../../lib/push', () => ({ subscribeToNearbyAlerts: vi.fn() }));
import { fetchVolunteerCount } from '../../lib/volunteerService';
beforeEach(() => vi.resetAllMocks());
it.each([0, 1502, '1502'])('reads a district aggregate without downloading volunteers (%s)', async total => {
  mocks.rpc.mockResolvedValue({ data: total, error: null });
  expect(await fetchVolunteerCount('Баянзүрх')).toBe(Number(total));
  expect(mocks.rpc).toHaveBeenCalledWith('get_volunteer_count', { target_district: 'Баянзүрх' });
  expect(mocks.from).not.toHaveBeenCalled();
});
it('propagates a missing RPC instead of falling back to a truncated full-table scan', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: new Error('migration missing') });
  await expect(fetchVolunteerCount('Баянзүрх')).rejects.toThrow('migration missing');
  expect(mocks.from).not.toHaveBeenCalled();
});
it.each([null, -1, 1.5, 'not a count', Number.MAX_SAFE_INTEGER + 1])('rejects invalid counts instead of presenting zero (%s)', async total => {
  mocks.rpc.mockResolvedValue({ data: total, error: null });
  await expect(fetchVolunteerCount('Хан-Уул')).rejects.toThrow('Invalid volunteer count');
});
