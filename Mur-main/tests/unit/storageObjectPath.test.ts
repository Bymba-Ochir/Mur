import { describe, expect, it } from 'vitest';
import { petPhotoStoragePath } from '../../lib/storageObjectPath';

describe('petPhotoStoragePath', () => {
  it('Supabase public URL-аас bucket доторх path-ийг гаргана', () => {
    expect(petPhotoStoragePath('https://demo.supabase.co/storage/v1/object/public/pet-photos/user-id/lost/cat%20photo.jpg')).toBe('user-id/lost/cat photo.jpg');
  });

  it('өөр bucket болон буруу URL-ийг зөвшөөрөхгүй', () => {
    expect(petPhotoStoragePath('https://demo.supabase.co/storage/v1/object/public/avatars/user/avatar.jpg')).toBeNull();
    expect(petPhotoStoragePath('not-a-url')).toBeNull();
    expect(petPhotoStoragePath(null)).toBeNull();
  });
});
