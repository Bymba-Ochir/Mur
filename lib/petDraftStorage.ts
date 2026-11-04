import { DISTRICTS } from './districts';
import type { PetFormData } from './usePetForm';
import type { PetStatus } from './types';
import { fingerprintSubmission, isIdempotencyKey, type IdempotencyAttempt } from './idempotency';

export interface PetDraftSnapshot {
  form: PetFormData;
  step: number;
  coords: { lat: number; lng: number } | null;
  photos: File[];
}

export interface PetDraft extends PetDraftSnapshot {
  version: 1;
  userId: string;
  status: PetStatus;
  revision: string;
  updatedAt: number;
  attempt: IdempotencyAttempt | null;
}

const STORE = 'drafts';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_PHOTO_BYTES = 16 * 1024 * 1024;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mur-pet-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(request.error);
    let blocked = false;
    request.onblocked = () => { blocked = true; reject(new Error('Draft storage is blocked')); };
    request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
  });
}

export function isPetDraft(value: unknown, userId: string, status: PetStatus): value is PetDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as PetDraft;
  const form = draft.form;
  return draft.version === 1 && draft.userId === userId && draft.status === status
    && isIdempotencyKey(draft.revision) && Number.isFinite(draft.updatedAt)
    && Date.now() - draft.updatedAt <= MAX_AGE
    && Number.isInteger(draft.step) && draft.step >= 0 && draft.step <= 3
    && Boolean(form) && typeof form === 'object'
    && ['name', 'breed', 'color', 'place', 'phone', 'reward'].every(key => {
      const text = form[key as keyof PetFormData];
      return typeof text === 'string' && text.length <= 500;
    })
    && ['Нохой', 'Муур', 'Бусад'].includes(form.type)
    && DISTRICTS.includes(form.district) && typeof form.hasReward === 'boolean'
    && (draft.coords === null || Boolean(draft.coords
      && Number.isFinite(draft.coords.lat) && Math.abs(draft.coords.lat) <= 90
      && Number.isFinite(draft.coords.lng) && Math.abs(draft.coords.lng) <= 180))
    && Array.isArray(draft.photos) && draft.photos.length <= 4
    && draft.photos.every(file => file instanceof File && file.type.startsWith('image/'))
    && draft.photos.reduce((bytes, file) => bytes + file.size, 0) <= MAX_PHOTO_BYTES
    && (draft.attempt === null || Boolean(draft.attempt
      && isIdempotencyKey(draft.attempt.key)
      && draft.attempt.fingerprint === fingerprintSubmission({ status, form, coords: draft.coords }, draft.photos)));
}

export async function readPetDraft(userId: string, status: PetStatus): Promise<PetDraft | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      const key = `${userId}:${status}`;
      const request = store.get(key);
      let draft: PetDraft | null = null;
      request.onsuccess = () => {
        if (isPetDraft(request.result, userId, status)) draft = request.result;
        else if (request.result !== undefined) store.delete(key);
      };
      transaction.oncomplete = () => resolve(draft);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

/** Read/compare/write in one IndexedDB transaction prevents stale tabs restoring cleared drafts. */
export async function writePetDraft(
  userId: string, status: PetStatus, expectedRevision: string | null, draft: PetDraft | null,
): Promise<void> {
  if (draft && !isPetDraft(draft, userId, status)) throw new Error('Invalid draft');
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      const key = `${userId}:${status}`;
      const request = store.get(key);
      let conflict = false;
      request.onsuccess = () => {
        if ((request.result?.revision ?? null) !== expectedRevision) {
          conflict = true;
          transaction.abort();
          return;
        }
        if (draft) store.put(draft, key);
        else store.delete(key);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(conflict ? new Error('DRAFT_CONFLICT') : transaction.error);
    });
  } finally {
    db.close();
  }
}
