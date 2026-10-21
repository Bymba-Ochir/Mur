import { describe, expect, it } from 'vitest';
import { finalizePage, pageWindow } from '../../lib/pagination';

describe('pagination helpers', () => {
  it('loads one extra row so callers can detect another page', () => {
    expect(pageWindow(2, 20)).toEqual({ page: 2, pageSize: 20, from: 40, to: 60 });
  });

  it('keeps only the requested page size and reports hasMore', () => {
    const rows = Array.from({ length: 21 }, (_, index) => index);
    expect(finalizePage(rows, 0, 20, 45)).toEqual({
      items: rows.slice(0, 20),
      hasMore: true,
      page: 0,
      total: 45,
    });
  });

  it('sanitizes invalid page inputs', () => {
    expect(pageWindow(-2, 0)).toEqual({ page: 0, pageSize: 24, from: 0, to: 24 });
  });
});
