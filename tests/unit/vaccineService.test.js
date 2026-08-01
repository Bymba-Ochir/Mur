import { describe, it, expect, vi } from 'vitest';

// lib/supabase.js нь import хийхэд шууд Supabase client үүсгэдэг тул
// (env хувьсагчгүй үед алдаа шиднэ) тестийн орчинд mock хийнэ.
vi.mock('../../lib/supabase', () => ({ supabase: {} }));

const { vaccineStatus } = await import('../../lib/vaccineService');

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

describe('vaccineStatus', () => {
  it('огноо тохируулаагүй бол "none"', () => {
    expect(vaccineStatus(null)).toBe('none');
    expect(vaccineStatus(undefined)).toBe('none');
  });

  it('хугацаа өнгөрсөн бол "overdue"', () => {
    expect(vaccineStatus(daysFromNow(-5))).toBe('overdue');
  });

  it('14 хоногийн дотор бол "soon"', () => {
    expect(vaccineStatus(daysFromNow(10))).toBe('soon');
  });

  it('14 хоногоос хол бол "ok"', () => {
    expect(vaccineStatus(daysFromNow(30))).toBe('ok');
  });
});
