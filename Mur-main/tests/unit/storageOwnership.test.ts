import { describe, expect, it } from 'vitest';
import { ownedPetPhotoStoragePath } from '../../lib/storageObjectPath';
const project = 'https://demo.supabase.co';
const base = project + '/storage/v1/object/public/pet-photos/';
describe('privileged storage cleanup', () => {
  it('allows the owner folder', () => expect(ownedPetPhotoStoragePath(base + 'alice/lost/cat.jpg', 'alice', project)).toBe('alice/lost/cat.jpg'));
  it('rejects other owners and prefix collisions', () => {
    for (const path of ['bob/cat.jpg', 'alice-other/cat.jpg']) expect(ownedPetPhotoStoragePath(base + path, 'alice', project)).toBeNull();
  });
  it('rejects external origins and missing configuration', () => {
    expect(ownedPetPhotoStoragePath(base.replace('demo.supabase.co', 'other.example') + 'alice/cat.jpg', 'alice', project)).toBeNull();
    expect(ownedPetPhotoStoragePath(base + 'alice/cat.jpg', 'alice', undefined)).toBeNull();
  });
  it('rejects encoded traversal', () => expect(ownedPetPhotoStoragePath(base + 'alice/%2e%2e%2fbob/cat.jpg', 'alice', project)).toBeNull());
});
