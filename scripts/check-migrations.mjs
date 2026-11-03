import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root,path),'utf8').replaceAll('\r\n','\n');
const hash = body => createHash('sha256').update(body).digest('hex');
try {
  const legacy = JSON.parse(read('supabase/legacy-sql-manifest.json'));
  const names = readdirSync(resolve(root,'supabase/migrations')).filter(name => name.endsWith('.sql')).sort();
  const versions = new Set();
  for (const name of names) {
    if (!/^\d{14}_[a-z][a-z0-9_]*\.sql$/.test(name)) throw new Error('Invalid migration filename: ' + name);
    const version = name.slice(0,14);
    if (versions.has(version)) throw new Error('Duplicate migration version: ' + version);
    versions.add(version);
    if (!read('supabase/migrations/' + name).trim()) throw new Error('Empty migration: ' + name);
  }
  const rootSql = readdirSync(root).filter(name => /^supabase.*\.sql$/.test(name)).sort();
  if (JSON.stringify(rootSql) !== JSON.stringify(legacy.map(row => row.source).sort())) throw new Error('New root SQL is forbidden. Use npm run db:new -- descriptive_name');
  for (const row of legacy) {
    if (hash(read(row.source)) !== row.sourceSha256) throw new Error('Historical SQL is immutable: ' + row.source);
    if (!existsSync(resolve(root,row.migration))) throw new Error('Historical SQL has no migration: ' + row.source);
  }
  const locked = JSON.parse(read('supabase/migration-lock.json'));
  for (const [path, digest] of Object.entries(locked)) {
    if (hash(read(path)) !== digest) throw new Error('Existing migration is immutable: ' + path);
  }
  // CI checks the base commit too: editing the lock file cannot authorize
  // rewriting/removing a previously committed migration.
  if (process.argv[2] === '--against') {
    const base = process.argv[3];
    if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('Invalid base commit');
    const paths = execFileSync('git',['ls-tree','-r','--name-only',base,'--','supabase/migrations'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
    for (const path of paths) {
      const absolute = resolve(root,path);
      if (relative(root,absolute).startsWith('..')) throw new Error('Invalid migration path');
      const before = execFileSync('git',['show',`${base}:${path}`],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
      if (!existsSync(absolute) || hash(read(path)) !== hash(before)) throw new Error('Committed migration changed: ' + path);
    }
  } else if (process.argv.length > 2) throw new Error('Unsupported migration check arguments');
  console.log(`PASS: ${names.length} ordered migrations; ${legacy.length} immutable historical SQL sources; no remote database access.`);
} catch (error) { console.error(error.message); process.exitCode=1; }
