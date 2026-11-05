export type ExportRow = Record<string, unknown>;
export const SERVER_PAGE_SIZE = 100;

/** Keyset paging avoids growing offsets and PostgREST's implicit response row cap. */
export async function* readKeysetPages(
  load: (after: string | undefined, size: number) => PromiseLike<{ data: ExportRow[] | null; error: unknown }>,
  key = 'id',
  size = SERVER_PAGE_SIZE,
): AsyncGenerator<ExportRow[]> {
  if (!Number.isInteger(size) || size < 1 || size > SERVER_PAGE_SIZE) throw new Error('Invalid server page size');
  let after: string | undefined;
  for (;;) {
    const { data, error } = await load(after, size);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length > size) throw new Error('Unbounded server page');
    if (!rows.length) return;
    const next = rows[rows.length - 1][key];
    if (typeof next !== 'string' || (after !== undefined && next <= after)) throw new Error('Invalid export cursor');
    yield rows;
    if (rows.length < size) return;
    after = next;
  }
}
