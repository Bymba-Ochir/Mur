import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('browser trust hardening migration', () => {
  const sql = readFileSync(resolve(process.cwd(), 'supabase-browser-trust-hardening-v98.sql'), 'utf8');

  it('binds listing ownership to auth.uid()', () => {
    expect(sql).toContain('with check (auth.uid() = created_by)');
    expect(sql.match(/with check \(auth\.uid\(\) = created_by\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('restricts storage uploads to the authenticated user folder', () => {
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(sql).toContain("lower(storage.extension(name)) in ('jpg','jpeg','png','webp')");
  });

  it('keeps public mutation tables server-only', () => {
    expect(sql).toContain('revoke insert, update on public.push_subscriptions from anon, authenticated');
    expect(sql).toContain('revoke insert on public.reports from anon, authenticated');
    expect(sql).toContain('revoke insert on public.sightings from anon, authenticated');
    expect(sql).toContain('revoke insert on public.donations from anon, authenticated');
  });
});
