import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/petDraftStorage', async importOriginal => ({
  ...await importOriginal<typeof import('../../lib/petDraftStorage')>(), readPetDraft: vi.fn(), writePetDraft: vi.fn(),
}));
import { isPetDraft, readPetDraft, writePetDraft, type PetDraft, type PetDraftSnapshot } from '../../lib/petDraftStorage';
import { usePetDraft } from '../../lib/usePetDraft';
import { fingerprintSubmission } from '../../lib/idempotency';

const userId = 'bbd603c4-f47d-4ddc-86ac-75a579fb5278';
const revision = '93c0a77d-f012-4c08-b4a3-bc0982b370fd';
const snapshot: PetDraftSnapshot = {
  form: { name: 'Муужгай', type: 'Муур', breed: '', color: 'Хар', place: 'Талбай', district: 'Баянзүрх', phone: '88112233', hasReward: false, reward: '' },
  step: 2, coords: { lat: 47.9, lng: 106.9 }, photos: [new File(['photo'], 'cat.jpg', { type: 'image/jpeg', lastModified: 1234 })],
};
function draft(): PetDraft { return { ...snapshot, version: 1, userId, status: 'lost', revision, updatedAt: Date.now(), attempt: null }; }
beforeEach(() => { vi.resetAllMocks(); vi.mocked(readPetDraft).mockResolvedValue(null); vi.mocked(writePetDraft).mockResolvedValue(); });
it('validates account, report type, expiry, photo metadata and persisted submission fingerprint', () => {
  const value = draft(); value.attempt = { key: revision, fingerprint: fingerprintSubmission({ status: 'lost', form: value.form, coords: value.coords }, value.photos) };
  expect(isPetDraft(value, userId, 'lost')).toBe(true);
  expect(isPetDraft(value, revision, 'lost')).toBe(false); expect(isPetDraft(value, userId, 'found')).toBe(false);
  expect(isPetDraft({ ...value, updatedAt: Date.now() - 8 * 86400000 }, userId, 'lost')).toBe(false);
  expect(isPetDraft({ ...value, photos: [new File(['different'], 'cat.jpg', { type: 'image/jpeg' })] }, userId, 'lost')).toBe(false);
});
it('does not overwrite an existing draft before the user resumes or discards it', async () => {
  const value = draft(); vi.mocked(readPetDraft).mockResolvedValue(value);
  const { result } = renderHook(() => usePetDraft(userId, 'lost', snapshot));
  await waitFor(() => expect(result.current.phase).toBe('prompt'));
  expect(writePetDraft).not.toHaveBeenCalled();
  act(() => { expect(result.current.resume()).toEqual(value); });
  await waitFor(() => expect(writePetDraft).toHaveBeenCalledWith(userId, 'lost', revision, expect.objectContaining({ photos: value.photos, step: 2 })), { timeout: 2000 });
});
it('persists the retry key before publishing, then clears the exact saved revision', async () => {
  const { result } = renderHook(() => usePetDraft(userId, 'lost', snapshot));
  await waitFor(() => expect(result.current.phase).toBe('editing'));
  const attempt = { key: revision, fingerprint: fingerprintSubmission({ status: 'lost', form: snapshot.form, coords: snapshot.coords }, snapshot.photos) };
  await act(() => result.current.saveAttempt(attempt));
  expect(writePetDraft).toHaveBeenLastCalledWith(userId, 'lost', null, expect.objectContaining({ attempt }));
  const saved = vi.mocked(writePetDraft).mock.calls.at(-1)![3]!;
  await act(() => result.current.clear());
  expect(writePetDraft).toHaveBeenLastCalledWith(userId, 'lost', saved.revision, null);
  expect(result.current.phase).toBe('complete');
});
it('stops stale-tab autosaves and shows a conflict instead of overwriting another tab', async () => {
  vi.mocked(writePetDraft).mockRejectedValue(new Error('DRAFT_CONFLICT'));
  const { result } = renderHook(() => usePetDraft(userId, 'lost', snapshot));
  await waitFor(() => expect(result.current.phase).toBe('editing'));
  await act(() => result.current.saveAttempt({ key: revision, fingerprint: 'invalid' }));
  expect(result.current.error).toBe('form_draft_conflict');
  const count = vi.mocked(writePetDraft).mock.calls.length;
  await act(() => result.current.saveAttempt({ key: revision, fingerprint: 'invalid' }));
  expect(writePetDraft).toHaveBeenCalledTimes(count);
});
it('keeps publishing available when browser storage is unavailable and shows a warning', async () => {
  vi.mocked(readPetDraft).mockRejectedValue(new Error('Quota exceeded'));
  const { result } = renderHook(() => usePetDraft(userId, 'lost', snapshot));
  await waitFor(() => expect(result.current.error).toBe('form_draft_error'));
  expect(result.current.phase).toBe('editing');
});
