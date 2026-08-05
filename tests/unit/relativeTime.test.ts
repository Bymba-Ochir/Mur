import { describe, it, expect } from 'vitest';
import { relativeTime } from '../../lib/relativeTime';

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60000).toISOString();
}
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

describe('relativeTime', () => {
  it('1 минутаас бага бол "Дөнгөж сая" гэнэ', () => {
    expect(relativeTime(new Date().toISOString())).toBe('Дөнгөж сая');
  });

  it('минутаар тооцоолно', () => {
    expect(relativeTime(minutesAgo(5))).toBe('5 минутын өмнө');
  });

  it('цагаар тооцоолно', () => {
    expect(relativeTime(minutesAgo(125))).toBe('2 цагийн өмнө');
  });

  it('яг 1 хоногийн өмнө бол "Өчигдөр" гэнэ', () => {
    expect(relativeTime(daysAgo(1))).toBe('Өчигдөр');
  });

  it('хоногоор тооцоолно', () => {
    expect(relativeTime(daysAgo(3))).toBe('3 хоногийн өмнө');
  });

  it('долоо хоногоор тооцоолно', () => {
    expect(relativeTime(daysAgo(10))).toBe('1 долоо хоногийн өмнө');
  });

  it('хоосон утганд хоосон мөр буцаана', () => {
    expect(relativeTime(null)).toBe('');
    expect(relativeTime(undefined)).toBe('');
  });
});
