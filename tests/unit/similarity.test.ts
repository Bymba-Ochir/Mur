import { describe, it, expect } from 'vitest';
import { cosineSimilarityScore } from '../../lib/similarity';

describe('cosineSimilarityScore', () => {
  it('яг ижил vector-ийн хувьд ~100% буцаана', () => {
    const v = [0.5, 0.3, 0.8, 0.1];
    expect(cosineSimilarityScore(v, v)).toBe(100);
  });

  it('перпендикуляр (огт хамааралгүй) vector-ийн хувьд 0% буцаана', () => {
    expect(cosineSimilarityScore([1, 0], [0, 1])).toBe(0);
  });

  it('урт таарахгүй vector-т 0 буцаана (embedding схем зөрсөн үед)', () => {
    expect(cosineSimilarityScore([1, 2, 3], [1, 2])).toBe(0);
  });

  it('null/undefined утганд 0 буцаана', () => {
    expect(cosineSimilarityScore(null, [1, 2])).toBe(0);
    expect(cosineSimilarityScore([1, 2], undefined)).toBe(0);
  });

  it('оноо үргэлж 0-100 хооронд байна', () => {
    const score = cosineSimilarityScore([0.9, 0.1, 0.4], [0.3, 0.8, 0.2]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
