import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { COVER_SAMPLE_SIZE, coverPhotoFingerprint } from '../../lib/coverPhotoFingerprint';
import { findSameListingPhotos } from '../../lib/listingPhotoMatch';
import { fetchPetMatches, rankBySimilarity } from '../../lib/petService';
import type { Pet } from '../../lib/types';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(), fetchPhoto: vi.fn(), hydrate: vi.fn(),
}));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from } }));
vi.mock('../../lib/supabaseClient', () => ({ databaseFetch: () => mocks.fetchPhoto }));
vi.mock('../../lib/photoRepository', () => ({ hydrateListingPhotos: mocks.hydrate, saveListingPhotos: vi.fn() }));

const projectUrl = 'http://127.0.0.1:54321';
const petPhoto = {
  id: 'dog', created_by: 'owner', created_at: '2026-11-01T00:00:00+00:00',
  photo_url: projectUrl + '/storage/v1/object/public/pet-photos/owner/lost/dog.jpg',
};

function pixels(isMirrored: boolean, brightness = 0) {
  const data = new Uint8ClampedArray(COVER_SAMPLE_SIZE * COVER_SAMPLE_SIZE * 4);
  for (let i = 0; i < data.length; i += 4) {
    const isLeft = (i / 4) % COVER_SAMPLE_SIZE < COVER_SAMPLE_SIZE / 2;
    const color = (isLeft === isMirrored ? 210 : 15) + brightness;
    data.set([color, color, color, 255], i);
  }
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hydrate.mockImplementation(async (_kind, rows) => rows);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each([false, true])('verifies a mirrored upload and rejects a fingerprint collision (collision: %s)', async (collision) => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', projectUrl);
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 640, height: 480, close: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(), drawImage: vi.fn(),
    getImageData: vi.fn()
      .mockReturnValueOnce({ data: pixels(true) })
      .mockReturnValueOnce({ data: pixels(false, collision ? 40 : 0) }),
  } as unknown as CanvasRenderingContext2D);
  const originalFingerprint = coverPhotoFingerprint(pixels(false), 4);
  mocks.rpc.mockImplementation((_name, { query_fingerprint }) => ({
    abortSignal: async () => ({ data: query_fingerprint === originalFingerprint ? [{ id: 'dog' }] : [], error: null }),
  }));
  mocks.from.mockReturnValue({
    select: () => ({ in: () => ({ eq: () => ({ eq: () => ({ is: () => ({
      abortSignal: async () => ({ data: [petPhoto], error: null }),
    }) }) }) }) }),
  });
  mocks.fetchPhoto.mockResolvedValue(new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/jpeg' } }));

  const matches = await findSameListingPhotos(new File(['image'], 'mirrored.jpg'), [], {}, new AbortController().signal);
  expect(matches.map(pet => pet.id)).toEqual(collision ? [] : ['dog']);
  expect(mocks.fetchPhoto).toHaveBeenCalledOnce();
});

it('takes the stronger match per listing and loads photos only for the final limited results', async () => {
  const match = (id: string, score: number) => ({
    pet: { ...petPhoto, id }, image_similarity: score / 100, hybrid_score: score,
  });
  mocks.rpc.mockResolvedValueOnce({ data: [match('ordinary', 75), match('both', 40)], error: null })
    .mockResolvedValueOnce({ data: [match('both', 90), match('mirror-only', 85)], error: null });

  const matches = await fetchPetMatches({ embeddings: [[1, 0], [0, 1]], imageHash: 'original-hash', limit: 2 });

  expect(matches?.map(pet => [pet.id, pet.similarity])).toEqual([['both', 90], ['mirror-only', 85]]);
  expect(mocks.hydrate).toHaveBeenCalledOnce();
  expect(mocks.hydrate.mock.calls[0][1].map((row: { id: string }) => row.id)).toEqual(['both', 'mirror-only']);
  expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'match_pets_hybrid', expect.objectContaining({
    query_embedding: [1, 0], query_image_hash: 'original-hash', match_count: 2,
  }));
  expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'match_pets_hybrid', expect.objectContaining({
    query_embedding: [0, 1], query_image_hash: null, match_count: 2,
  }));
});

it('keeps a mirror-only result in the browser fallback', () => {
  const pet = { id: 'mirror', embedding: [0, 1] } as Pet;
  expect(rankBySimilarity([[1, 0], [0, 1]], [pet])).toEqual([{ ...pet, similarity: 100 }]);
});
