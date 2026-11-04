import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/serverImageEmbedding', () => ({ embedStoredImage: vi.fn() }));
vi.mock('../../lib/apiRateLimit', () => ({ limitServiceRequest: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
import { after } from 'next/server';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { embedStoredImage } from '../../lib/serverImageEmbedding';
import { limitServiceRequest } from '../../lib/apiRateLimit';
import { reportError } from '../../lib/errorTracking';
import { runPetImageJob, schedulePetImageJob } from '../../lib/petImageJobs';

const owner = 'bbd603c4-f47d-4ddc-86ac-75a579fb5278';
const petId = '93c0a77d-f012-4c08-b4a3-bc0982b370fd';
const job = { id: petId, lease_token: owner, payload: { petId, revision: owner } };
const rpc = vi.fn(), from = vi.fn(), info = vi.fn(), download = vi.fn();
const admin = { rpc, from, storage: { from: vi.fn(() => ({ info, download })) } } as unknown as ReturnType<typeof createAdminClient>;
let pet: Record<string, unknown>, tasks: Array<() => unknown>;
beforeEach(() => {
  vi.resetAllMocks(); tasks = [];
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  pet = { id: petId, created_by: owner, embedding_revision: owner,
    embedding_photo_url: `http://127.0.0.1:54321/storage/v1/object/public/pet-photos/${owner}/lost/photo.jpg` };
  rpc.mockImplementation(async (name: string) => ({ error: null, data: name === 'claim_pet_image_job' ? [job] : true }));
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: pet, error: null })) };
  from.mockReturnValue(query);
  vi.mocked(admin.storage.from).mockReturnValue({ info, download } as unknown as ReturnType<typeof admin.storage.from>);
  info.mockResolvedValue({ data: { size: 3 }, error: null });
  download.mockResolvedValue({ data: new NodeBlob(['abc']), error: null });
  vi.mocked(embedStoredImage).mockResolvedValue([1, ...Array<number>(383).fill(0)]);
  vi.mocked(createAdminClient).mockReturnValue(admin);
  vi.mocked(after).mockImplementation(task => { if (typeof task === 'function') tasks.push(task); });
  vi.mocked(limitServiceRequest).mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

it('uses only the database-owned storage path and completes with its lease and hash', async () => {
  expect(await runPetImageJob(admin)).toBe(true);
  expect(download).toHaveBeenCalledWith(`${owner}/lost/photo.jpg`, {}, { signal: expect.any(AbortSignal) });
  expect(rpc).toHaveBeenCalledWith('complete_pet_image_embedding', expect.objectContaining({
    target_job: petId, target_lease: owner, target_embedding: expect.any(Array),
    target_hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  }));
  expect(rpc).toHaveBeenLastCalledWith('finish_background_job', expect.objectContaining({ outcome: 'done' }));
});
it.each(['https://attacker.test/photo.jpg', `http://127.0.0.1:54321/storage/v1/object/public/pet-photos/${petId}/lost/photo.jpg`])('never fetches unowned or external URL %s', async url => {
  pet.embedding_photo_url = url; await runPetImageJob(admin);
  expect(download).not.toHaveBeenCalled(); expect(embedStoredImage).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenLastCalledWith('finish_background_job', expect.objectContaining({ outcome: 'retry' }));
});
it('skips a replaced photo and never runs inference for the obsolete revision', async () => {
  pet.embedding_revision = petId; await runPetImageJob(admin);
  expect(download).not.toHaveBeenCalled(); expect(embedStoredImage).not.toHaveBeenCalled();
});
it('checks file size before downloading, retries failures and reports a sanitized error', async () => {
  info.mockResolvedValue({ data: { size: 9 * 1024 * 1024 }, error: null });
  await runPetImageJob(admin); expect(download).not.toHaveBeenCalled();
  expect(reportError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Stored pet image processing failed' }), expect.anything());
  expect(rpc).toHaveBeenLastCalledWith('finish_background_job', expect.objectContaining({ outcome: 'retry' }));
});
it('does not acknowledge a lost lease', async () => {
  rpc.mockImplementation(async (name: string) => ({ error: null, data: name === 'claim_pet_image_job' ? [job] : name !== 'finish_background_job' }));
  await expect(runPetImageJob(admin)).rejects.toThrow('lease lost');
});
it('defers inference until after the response and bounds a run to three jobs', async () => {
  schedulePetImageJob(); expect(rpc).not.toHaveBeenCalled();
  await tasks[0](); expect(rpc.mock.calls.filter(([name]) => name === 'claim_pet_image_job')).toHaveLength(3);
});
it('does no processing when the shared service budget is exhausted', async () => {
  vi.mocked(limitServiceRequest).mockResolvedValue(Response.json({}, { status: 429 }) as Awaited<ReturnType<typeof limitServiceRequest>>);
  schedulePetImageJob(); await tasks[0](); expect(rpc).not.toHaveBeenCalled();
});
