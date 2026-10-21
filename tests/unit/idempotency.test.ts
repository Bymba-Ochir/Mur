import { describe, expect, it } from 'vitest';
import {
  createIdempotencyKey,
  fingerprintSubmission,
  isIdempotencyKey,
  resolveIdempotencyAttempt,
} from '../../lib/idempotency';

describe('idempotency helpers', () => {
  it('creates valid UUID v4 keys', () => {
    const key = createIdempotencyKey();
    expect(isIdempotencyKey(key)).toBe(true);
  });

  it('reuses a key for the same submission fingerprint', () => {
    const first = resolveIdempotencyAttempt(null, 'same');
    const second = resolveIdempotencyAttempt(first, 'same');
    expect(second).toBe(first);
  });

  it('creates a new key when the submission changes', () => {
    const first = resolveIdempotencyAttempt(null, 'before');
    const second = resolveIdempotencyAttempt(first, 'after');
    expect(second.key).not.toBe(first.key);
  });

  it('includes file metadata in submission fingerprints', () => {
    const fileA = new File(['cat'], 'pet.jpg', { type: 'image/jpeg', lastModified: 1 });
    const fileB = new File(['cats'], 'pet.jpg', { type: 'image/jpeg', lastModified: 1 });
    expect(fingerprintSubmission({ status: 'lost' }, [fileA]))
      .not.toBe(fingerprintSubmission({ status: 'lost' }, [fileB]));
  });
});
