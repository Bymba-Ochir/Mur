import { ownedPetPhotoStoragePath } from './storageObjectPath';
import { databaseFetch } from './supabaseClient';
import type { Pet } from './types';

const SAMPLE_SIZE = 32;
const MAX_CANDIDATES = 6;
const MAX_CANDIDATE_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

async function samplePhoto(photo: Blob) {
  const bitmap = await createImageBitmap(photo);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) return null;
    // Match the black matte used when the upload canvas exports a JPEG.
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#000';
    context.fillRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    context.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return {
      aspect: bitmap.width / bitmap.height,
      pixels: context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data,
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
  const channels = SAMPLE_SIZE * SAMPLE_SIZE * 3;
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

/** Compare a small batch of already loaded cover photos without sending the search image. */
export async function findSameListingPhotos(file: File, pets: Pet[], signal: AbortSignal): Promise<Pet[]> {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl || signal.aborted || file.size > MAX_SOURCE_BYTES) return [];
  const candidates = pets.filter(pet => pet.photoURL).slice(0, MAX_CANDIDATES);
  if (!candidates.length) return [];

  const source = await samplePhoto(file).catch(() => null);
  if (!source || signal.aborted) return [];

  const fetchPhoto = databaseFetch(projectUrl);
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(3000)]);
  const matches = await Promise.all(candidates.map(async pet => {
    const path = ownedPetPhotoStoragePath(pet.photoURL, pet.createdBy, projectUrl);
    if (!path) return null;
    const objectPath = path.split('/').map(encodeURIComponent).join('/');
    const url = new URL('/storage/v1/object/public/pet-photos/' + objectPath, projectUrl);
    try {
      const response = await fetchPhoto(url, { signal: deadline, credentials: 'omit', redirect: 'error' });
      const photo = await readPhoto(response);
      const candidate = photo && !deadline.aborted ? await samplePhoto(photo) : null;
      return candidate && !deadline.aborted && isSamePhoto(source, candidate) ? pet : null;
    } catch {
      return null;
    }
  }));
  return signal.aborted ? [] : matches.filter(pet => pet !== null);
}
