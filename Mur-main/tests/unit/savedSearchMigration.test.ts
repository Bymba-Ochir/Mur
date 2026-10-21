import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase-saved-searches-v55.sql'), 'utf8');

describe('saved search v55 migration', () => {
  it('matches the selected status instead of the opposite status', () => {
    expect(sql).toContain('(s.status is null or s.status = new.status)');
    expect(sql).not.toContain('new.status<>s.status');
  });

  it('removes the legacy duplicate notification trigger', () => {
    expect(sql).toContain('drop trigger if exists pets_saved_search_notify');
    expect(sql).toContain("'saved_search'");
  });
});
