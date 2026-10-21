export const DEFAULT_PAGE_SIZE = 24;
export const COMPACT_PAGE_SIZE = 20;

export interface PageResult<T> {
  items: T[];
  hasMore: boolean;
  page: number;
  total: number | null;
}

function safeInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

export function pageWindow(page = 0, pageSize = DEFAULT_PAGE_SIZE): { page: number; pageSize: number; from: number; to: number } {
  const safePage = safeInteger(page, 0);
  const safePageSize = Math.min(Math.max(safeInteger(pageSize, DEFAULT_PAGE_SIZE), 1), 100);
  const from = safePage * safePageSize;
  return { page: safePage, pageSize: safePageSize, from, to: from + safePageSize };
}

export function finalizePage<T>(rows: T[] | null | undefined, page = 0, pageSize = DEFAULT_PAGE_SIZE, total: number | null = null): PageResult<T> {
  const window = pageWindow(page, pageSize);
  const source = rows ?? [];
  return {
    items: source.slice(0, window.pageSize),
    hasMore: source.length > window.pageSize,
    page: window.page,
    total,
  };
}
