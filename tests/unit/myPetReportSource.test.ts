import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(),
  query: { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), maybeSingle: vi.fn() },
}));
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
import { fetchMyPetById, fetchMyPets } from '../../lib/vaccineService';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'verified-owner' } } });
  mocks.from.mockReturnValue(mocks.query);
  mocks.query.select.mockReturnValue(mocks.query);
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.query.order.mockReturnValue(mocks.query);
  mocks.query.range.mockResolvedValue({ data: [], error: null });
  mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });
});

describe('owner-scoped pet reads for lost reports', () => {
  it('filters the linked pet by the authenticated owner as well as its id', async () => {
    await expect(fetchMyPetById('foreign-pet')).rejects.toThrow();
    expect(mocks.query.eq.mock.calls).toEqual([['id', 'foreign-pet'], ['user_id', 'verified-owner']]);
  });

  it('requires a verified user before looking up a linked pet', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(fetchMyPetById('any-pet')).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('bounds and consistently orders each page of the owner pets', async () => {
    await expect(fetchMyPets({ offset: 6, limit: 7 })).resolves.toEqual([]);
    expect(mocks.query.eq).toHaveBeenCalledWith('user_id', 'verified-owner');
    expect(mocks.query.range).toHaveBeenCalledWith(6, 12);
    expect(mocks.query.order.mock.calls).toEqual([['created_at', { ascending: false }], ['id', { ascending: false }]]);
  });

  it.each([{ offset: -1, limit: 7 }, { offset: 0, limit: 1000 }, { offset: 0.5, limit: 7 }])('rejects an invalid page %j', async page => {
    await expect(fetchMyPets(page)).rejects.toThrow('Invalid pet page');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
