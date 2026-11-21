import { beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), upload: vi.fn(), remove: vi.fn(), validate: vi.fn(),
  query: { insert: vi.fn(), update: vi.fn(), select: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() },
}));
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { getUser: mock.getUser }, from: mock.from } }));
vi.mock('../../lib/myPetPhoto', () => ({ uploadMyPetPhoto: mock.upload, removeMyPetPhoto: mock.remove, validateMyPetPhoto: mock.validate }));
import { createMyPet, updateMyPet } from '../../lib/vaccineService';

beforeEach(() => {
  vi.clearAllMocks();
  mock.getUser.mockResolvedValue({ data: { user: { id: 'owner' } } });
  mock.from.mockReturnValue(mock.query);
  for (const key of ['insert', 'update', 'select', 'eq'] as const) mock.query[key].mockReturnValue(mock.query);
  mock.query.single.mockResolvedValue({ data: { id: 'pet', name: 'Бор', type: 'Нохой', markings: 'Цээж цагаан', photo_url: 'new-photo' }, error: null });
  mock.query.maybeSingle.mockResolvedValue({ data: { id: 'pet', photo_url: 'old-photo' }, error: null });
  mock.upload.mockResolvedValue('new-photo');
  mock.remove.mockResolvedValue(undefined);
});

it('stores and returns reusable features and the uploaded photo', async () => {
  const file = new File(['photo'], 'pet.jpg', { type: 'image/jpeg' });
  const pet = await createMyPet({ name: 'Бор', type: 'Нохой', markings: ' Цээж  цагаан ', photoFile: file });
  expect(mock.query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'owner', markings: 'Цээж цагаан', photo_url: 'new-photo' }));
  expect(pet).toMatchObject({ markings: 'Цээж цагаан', photoUrl: 'new-photo' });
  expect(mock.upload).toHaveBeenCalledWith(file, 'owner', expect.any(String));
});

it('rejects overlong features before uploading or inserting', async () => {
  await expect(createMyPet({ name: 'Бор', type: 'Нохой', markings: 'x'.repeat(101), photoFile: new File(['x'], 'pet.jpg') })).rejects.toThrow();
  expect(mock.upload).not.toHaveBeenCalled(); expect(mock.from).not.toHaveBeenCalled();
});

it('cleans up a newly uploaded photo when registration fails', async () => {
  mock.query.single.mockResolvedValue({ data: null, error: new Error('offline') });
  await expect(createMyPet({ name: 'Бор', type: 'Нохой', photoFile: new File(['x'], 'pet.jpg') })).rejects.toThrow('offline');
  expect(mock.remove).toHaveBeenCalledWith('new-photo', 'owner');
});

it('requires a verified owner before any photo write', async () => {
  mock.getUser.mockResolvedValue({ data: { user: null } });
  await expect(createMyPet({ name: 'Бор', type: 'Нохой', photoFile: new File(['x'], 'pet.jpg') })).rejects.toThrow();
  expect(mock.upload).not.toHaveBeenCalled();
});

it('updates features without clearing an existing photo', async () => {
  await updateMyPet('pet', { markings: 'Шинэ шинж' });
  expect(mock.query.update).toHaveBeenCalledWith({ markings: 'Шинэ шинж' });
  expect(mock.upload).not.toHaveBeenCalled(); expect(mock.remove).not.toHaveBeenCalled();
  expect(mock.query.eq).toHaveBeenCalledWith('user_id', 'owner');
});

it('checks ownership before replacing a photo', async () => {
  mock.query.maybeSingle.mockResolvedValue({ data: null, error: null });
  await expect(updateMyPet('foreign', { photoFile: new File(['x'], 'pet.jpg') })).rejects.toThrow();
  expect(mock.upload).not.toHaveBeenCalled(); expect(mock.query.update).not.toHaveBeenCalled();
});

it('keeps the previous photo if the database update fails', async () => {
  mock.query.maybeSingle.mockResolvedValueOnce({ data: { id: 'pet', photo_url: 'old-photo' }, error: null })
    .mockResolvedValueOnce({ data: null, error: new Error('offline') });
  await expect(updateMyPet('pet', { photoFile: new File(['x'], 'pet.jpg') })).rejects.toThrow('offline');
  expect(mock.remove).toHaveBeenCalledWith('new-photo', 'owner');
  expect(mock.remove).not.toHaveBeenCalledWith('old-photo', 'owner');
});
