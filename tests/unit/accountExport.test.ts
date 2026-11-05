import { expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { readKeysetPages } from '../../lib/serverPagination';
import { encodeAccountExport } from '../../lib/accountExport';

it('exports more than the API row cap, including a final partial page', async () => {
  const rows = Array.from({ length: 1105 }, (_, index) => ({ id: String(index).padStart(5, '0') }));
  const load = vi.fn(async (after: string | undefined, size: number) => ({ data: rows.filter(row => !after || row.id > after).slice(0, size), error: null }));
  let json = '';
  for await (const chunk of encodeAccountExport({ id: 'verified-user' } as User, null, { messages: readKeysetPages(load) })) json += chunk;
  expect(JSON.parse(json).messages).toEqual(rows);
  expect(load).toHaveBeenCalledTimes(12);
  expect(load.mock.calls.every(([, size]) => size === 100)).toBe(true);
});

it('uses the favorites pet_id cursor and probes an exact final full page', async () => {
  const load = vi.fn().mockResolvedValueOnce({ data: [{ pet_id: 'a' }, { pet_id: 'b' }], error: null }).mockResolvedValueOnce({ data: [], error: null });
  const pages = [];
  for await (const page of readKeysetPages(load, 'pet_id', 2)) pages.push(page);
  expect(pages.flat()).toHaveLength(2);
  expect(load).toHaveBeenLastCalledWith('b', 2);
});

it('does not silently complete a truncated export on a later DB failure', async () => {
  const load = vi.fn().mockResolvedValueOnce({ data: [{ id: 'a' }], error: null }).mockResolvedValueOnce({ data: null, error: new Error('Database unavailable') });
  let json = '';
  await expect((async () => {
    for await (const chunk of encodeAccountExport({ id: 'verified' } as User, null, { messages: readKeysetPages(load, 'id', 1) })) json += chunk;
  })()).rejects.toThrow('Database unavailable');
  expect(() => JSON.parse(json)).toThrow();
});

it('fails rather than looping when a data source does not advance its cursor', async () => {
  const pages = readKeysetPages(async () => ({ data: [{ id: 'a' }], error: null }), 'id', 1);
  await pages.next();
  await expect(pages.next()).rejects.toThrow('Invalid export cursor');
});

it('does not fetch ahead while the JSON consumer is paused', async () => {
  const load = vi.fn(async () => ({ data: [{ id: 'a' }], error: null }));
  const stream = encodeAccountExport({ id: 'verified' } as User, null, { pets: readKeysetPages(load) });
  await stream.next();
  await stream.next();
  expect(load).not.toHaveBeenCalled();
  await stream.next();
  expect(load).toHaveBeenCalledOnce();
  await stream.return();
});
