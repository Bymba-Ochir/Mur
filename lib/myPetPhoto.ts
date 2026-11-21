import { supabase } from './supabase';
import { createIdempotencyKey } from './idempotency';
import { ownedPetPhotoStoragePath } from './storageObjectPath';

const BUCKET = 'pet-photos';
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function validateMyPetPhoto(file: File): void {
  if (!TYPES[file.type] || !file.size || file.size > 10 * 1024 * 1024) {
    throw new Error('JPG, PNG эсвэл WebP зураг сонгоно уу (10 МБ хүртэл).');
  }
}

export async function uploadMyPetPhoto(file: File, ownerId: string, petId: string): Promise<string> {
  validateMyPetPhoto(file);
  const path = `${ownerId}/my-pets/${petId}/${createIdempotencyKey()}.${TYPES[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeMyPetPhoto(url: string, ownerId: string): Promise<void> {
  const path = ownedPetPhotoStoragePath(url, ownerId, process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!path?.startsWith(ownerId + '/my-pets/')) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function loadMyPetPhotoFile(url: string, ownerId: string): Promise<File> {
  const path = ownedPetPhotoStoragePath(url, ownerId, process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!path) throw new Error('Амьтны зургийн холбоос буруу байна.');
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error || new Error('Амьтны зургийг ачаалж чадсангүй.');
  const type = data.type.toLowerCase().split(';')[0];
  const file = new File([data], 'my-pet.' + (TYPES[type] || 'jpg'), { type });
  validateMyPetPhoto(file);
  return file;
}
