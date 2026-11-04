import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
import { supabase } from '../../lib/supabase';
import { getOwnListingPhone, listingPhone } from '../../lib/listingContact';
beforeEach(() => vi.resetAllMocks());
it('requires a valid public phone and allows chat-only submissions without one', () => {
  expect(listingPhone('88 11 22 33')).toBe('88112233');
  expect(() => listingPhone('123')).toThrow();
  expect(listingPhone('', true)).toBe(''); expect(listingPhone('123', true)).toBe('');
  expect(listingPhone('+976 88 11 22 33', true)).toBe('88112233');
});
it('requests private contact by listing only, leaving the owner check to verified database identity', async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({ data: '88112233', error: null } as Awaited<ReturnType<typeof supabase.rpc>>);
  expect(await getOwnListingPhone('sitting', 'id')).toBe('88112233');
  expect(supabase.rpc).toHaveBeenCalledWith('get_own_listing_phone', { target_kind: 'sitting', target_id: 'id' });
  vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'OWNER_REQUIRED' } } as Awaited<ReturnType<typeof supabase.rpc>>);
  await expect(getOwnListingPhone('pet', 'id')).rejects.toEqual({ message: 'OWNER_REQUIRED' });
});
