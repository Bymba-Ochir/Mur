import { ownedPetPhotoStoragePath } from './storageObjectPath';
import { databaseFetch } from './supabaseClient';
import { COVER_SAMPLE_SIZE, coverPhotoFingerprint } from './coverPhotoFingerprint';
import { fetchPetCoverCandidates } from './petService';
import type { Pet, PetFilters } from './types';

const LOCAL_FALLBACK_LIMIT = 6;
const MAX_CANDIDATE_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

async function samplePhoto(photo: Blob) {
  const bitmap = await createImageBitmap(photo);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = COVER_SAMPLE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) return null;
    // Match the black matte used when the upload canvas exports a JPEG.
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#000';
    context.fillRect(0, 0, COVER_SAMPLE_SIZE, COVER_SAMPLE_SIZE);
    context.drawImage(bitmap, 0, 0, COVER_SAMPLE_SIZE, COVER_SAMPLE_SIZE);
    return {
      aspect: bitmap.width / bitmap.height,
      pixels: context.getImageData(0, 0, COVER_SAMPLE_SIZE, COVER_SAMPLE_SIZE).data,
    };
  } finally {
    bitmap.close();
  }
}

type PhotoSample = NonNullable<Awaited<ReturnType<typeof samplePhoto>>>;

function isSamePhoto(source: PhotoSample, candidate: PhotoSample) {
  if (Math.abs(Math.log(source.aspect / candidate.aspect)) > 0.03) return false;
  let difference = 0;
  let squaredDifference = 0;
  for (let i = 0; i < source.pixels.length; i += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = source.pixels[i + channel] - candidate.pixels[i + channel];
      difference += Math.abs(delta);
      squaredDifference += delta * delta;
    }
  }
  const channels = COVER_SAMPLE_SIZE * COVER_SAMPLE_SIZE * 3;
  // Allow small encoding differences while rejecting changes to the composition.
  return difference / channels <= 5 && squaredDifference / channels <= 100;
}

async function readPhoto(response: Response) {
  const type = response.headers.get('content-type') ?? '';
  if (!response.ok || !type.startsWith('image/') || !response.body
    || Number(response.headers.get('content-length')) > MAX_CANDIDATE_BYTES) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body.getReader();
  const bytes = new Uint8Array(MAX_CANDIDATE_BYTES);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return new Blob([bytes.subarray(0, length)], { type });
      if (length + value.byteLength > MAX_CANDIDATE_BYTES) {
        await reader.cancel();
        return null;
      }
      bytes.set(value, length);
      length += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
}

async function verifyCandidates(source: PhotoSample, candidates: Pet[], projectUrl: string, signal: AbortSignal) {
  const fetchPhoto = databaseFetch(projectUrl);
  const matches = await Promise.all(candidates.map(async pet => {
    const path = ownedPetPhotoStoragePath(pet.photoURL, pet.createdBy, projectUrl);
    if (!path) return null;
    const objectPath = path.split('/').map(encodeURIComponent).join('/');
    const url = new URL('/storage/v1/object/public/pet-photos/' + objectPath, projectUrl);
    try {
      const response = await fetchPhoto(url, { signal, credentials: 'omit', redirect: 'error' });
      const photo = await readPhoto(response);
      const candidate = photo && !signal.aborted ? await samplePhoto(photo) : null;
      return candidate && !signal.aborted && isSamePhoto(source, candidate) ? pet : null;
    } catch {
      return null;
    }
  }));
  return signal.aborted ? [] : matches.filter(pet => pet !== null);
}

/** Search indexed active covers first, with a small fallback while older photos are being indexed. */
export async function findSameListingPhotos(file: File, pets: Pet[], filters: PetFilters, signal: AbortSignal): Promise<Pet[]> {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl || signal.aborted || file.size > MAX_SOURCE_BYTES) return [];
  const source = await samplePhoto(file).catch(() => null);
  if (!source || signal.aborted) return [];

  const fingerprint = coverPhotoFingerprint(source.pixels, 4);
  const candidates = await fetchPetCoverCandidates(fingerprint, filters, signal).catch(() => []);
  if (signal.aborted) return [];
  const matches = await verifyCandidates(source, candidates, projectUrl, AbortSignal.any([signal, AbortSignal.timeout(3000)]));
  if (matches.length || signal.aborted) return matches;

  const checked = new Set(candidates.map(pet => pet.id));
  const fallback = pets.filter(pet => pet.photoURL && !checked.has(pet.id)).slice(0, LOCAL_FALLBACK_LIMIT);
  return verifyCandidates(source, fallback, projectUrl, AbortSignal.any([signal, AbortSignal.timeout(3000)]));
}
