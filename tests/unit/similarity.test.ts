import { describe, it, expect } from 'vitest';
import { calculateHybridScore, cosineSimilarityScore } from '../../lib/similarity';

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

describe('calculateHybridScore', () => {
  it('бүх дохио таарвал 100 оноо өгнө', () => {
    expect(calculateHybridScore({ imageSimilarity: 1, sameType: true, sameBreed: true, sameColor: true, sameDistrict: true, nearby: true, ageDays: 0 })).toBe(100);
  });

  it('зураг, төрөл, байршлын дохиог жингээр нэгтгэнэ', () => {
    expect(calculateHybridScore({ imageSimilarity: 0.8, sameType: true, sameDistrict: true, ageDays: 30 })).toBe(71);
  });

  it('оноог 0-100 хүрээнд хадгална', () => {
    expect(calculateHybridScore({ imageSimilarity: 2, sameType: true, sameBreed: true, sameColor: true, sameDistrict: true, nearby: true })).toBe(100);
  });
});
