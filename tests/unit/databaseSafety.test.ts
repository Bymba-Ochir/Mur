import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertDatabaseTarget, assertLocalPostgresTarget, allowsHostedDatabase, isLocalPage } from '../../lib/databaseSafety.cjs';
import { databaseFetch, createPublicClient } from '../../lib/supabaseClient';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('local database isolation', () => {
  it.each(['http://127.0.0.1:54321','http://localhost:54321','http://[::1]:54321'])('accepts the local API: %s', url => {
    expect(assertDatabaseTarget(url,false).port).toBe('54321');
  });
  it.each(['https://production.supabase.co','https://staging.supabase.co','http://127.0.0.1.evil.test:54321','http://192.168.0.5:54321','http://127.0.0.1:443','https://localhost:54321','http://user:secret@127.0.0.1:54321'])('rejects nonlocal or ambiguous targets: %s', url => {
    expect(() => assertDatabaseTarget(url,false)).toThrow();
  });
  it('does not treat NODE_ENV=production or a copied hosted browser bundle as permission', () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('NEXT_PUBLIC_DATABASE_MODE','hosted');
    expect(allowsHostedDatabase()).toBe(false);
    expect(() => assertDatabaseTarget('https://production.supabase.co')).toThrow('LOCAL_DATABASE_REQUIRED');
  });
  it('allows hosted HTTPS only in an explicitly hosted context', () => {
    expect(assertDatabaseTarget('https://production.supabase.co',true).protocol).toBe('https:');
    expect(() => assertDatabaseTarget('http://production.supabase.co',true)).toThrow();
  });
  it('allows the hosted browser client only on its HTTPS deployment hosts', () => {
    vi.stubEnv('NEXT_PUBLIC_DATABASE_MODE','hosted'); vi.stubEnv('NEXT_PUBLIC_DATABASE_HOSTS','mur-chi.vercel.app');
    vi.stubGlobal('window',{location:{protocol:'https:',hostname:'mur-chi.vercel.app'}});
    expect(allowsHostedDatabase()).toBe(true);
    vi.stubGlobal('window',{location:{protocol:'https:',hostname:'unlisted.example'}});
    expect(allowsHostedDatabase()).toBe(false);
  });
  it.each(['production','preview'])('preserves the Vercel Linux %s server configuration', deployment => {
    const code = "const g=require('./lib/databaseSafety.cjs');Object.defineProperty(process,'platform',{value:'linux'});console.log(g.allowsHostedDatabase());";
    const result = spawnSync(process.execPath,['-e',code],{encoding:'utf8',windowsHide:true,
      env:{...process.env,VERCEL:'1',VERCEL_ENV:deployment,MUR_FORCE_LOCAL_DB:'0'},
    });
    expect(result.status).toBe(0); expect(result.stdout.trim()).toBe('true');
  });
  it('recognizes localhost and private LAN browser hosts', () => {
    for (const host of ['localhost','127.0.0.1','[::1]','192.168.1.5','10.1.2.3','172.16.0.4','mur.local']) expect(isLocalPage(host)).toBe(true);
    expect(isLocalPage('mur-chi.vercel.app')).toBe(false);
  });
  it('rejects both public/admin constructors before any HTTP request', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch',fetch);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://production.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','private-do-not-print');
    expect(createPublicClient).toThrow('LOCAL_DATABASE_REQUIRED');
    expect(createAdminClient).toThrow('LOCAL_DATABASE_REQUIRED'); expect(fetch).not.toHaveBeenCalled();
  });
  it('pins HTTP origin and forbids redirects for local Auth/REST/Storage requests', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}')); vi.stubGlobal('fetch',fetch);
    const guarded = databaseFetch('http://127.0.0.1:54321');
    await guarded('http://127.0.0.1:54321/rest/v1/pets?select=id&limit=20');
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:54321/rest/v1/pets?select=id&limit=20',{redirect:'error'});
    await expect(guarded('https://production.supabase.co/rest/v1/pets')).rejects.toThrow();
    await expect(guarded('http://localhost:54321/rest/v1/pets')).rejects.toThrow('DATABASE_ORIGIN_MISMATCH');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('blocks remote direct PostgreSQL tools without echoing their credentials', () => {
    expect(assertLocalPostgresTarget('postgresql://postgres:local@127.0.0.1:54322/postgres').port).toBe('54322');
    for (const url of [
      'postgresql://postgres:private@db.production.supabase.co:5432/postgres',
      'postgres://localhost:5432/postgres',
      'postgresql://postgres:local@127.0.0.1:54322/postgres?host=db.production.supabase.co&port=5432',
      'postgresql://postgres:local@127.0.0.1:54322/postgres?hostaddr=203.0.113.10',
      'postgresql://postgres:local@127.0.0.1:54322/postgres?service=production',
    ]) {
      expect(() => assertLocalPostgresTarget(url)).toThrow('LOCAL_POSTGRES_REQUIRED');
    }
  });
});

describe('all database entry points stay guarded', () => {
  function sources(path: string): string[] {
    return readdirSync(path,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? sources(resolve(path,entry.name)) : /\.(tsx?|[cm]?js)$/.test(entry.name) ? [resolve(path,entry.name)] : []);
  }
  it('has no raw SDK constructor outside the two shared factories', () => {
    for (const file of [...sources(resolve('app')),...sources(resolve('lib'))]) {
      if (/\bcreateClient\(/.test(readFileSync(file,'utf8'))) expect(file.replaceAll('\\','/')).toMatch(/lib\/supabase(?:Client|Admin)\.ts$/);
    }
  });
  it.each(['reset','migrate','test','start','diff'])('does not forward arbitrary remote flags for db:%s', command => {
    const result = spawnSync(process.execPath,['scripts/local-db.mjs',command,'--linked'],{encoding:'utf8',windowsHide:true,timeout:10_000});
    expect(result.status).toBe(1); expect(result.stderr).toContain('Remote targets and extra flags are forbidden');
  });
  it('blocks a local build before Next starts when the shell points at a hosted database', () => {
    const result = spawnSync(process.execPath,['scripts/run-next.mjs','build'],{encoding:'utf8',windowsHide:true,timeout:10_000,
      env: {...process.env,VERCEL:'0',NEXT_PUBLIC_SUPABASE_URL:'https://production.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-do-not-print'},
    });
    expect(result.status).toBe(1); expect(result.stderr).toContain('LOCAL_DATABASE_REQUIRED');
    expect(result.stderr).not.toContain('private-do-not-print'); expect(result.stdout).not.toContain('Creating an optimized production build');
  });
});
