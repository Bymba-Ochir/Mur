import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import safety from '../lib/databaseSafety.cjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2];
if (!['dev', 'build', 'start'].includes(command)) throw new Error('Unsupported Next command');
const hosted = safety.allowsHostedDatabase();
if (!hosted) {
  process.env.MUR_FORCE_LOCAL_DB = '1';
  process.env.VERCEL = '0';
  process.env.VERCEL_ENV = 'development';
}
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(root, command === 'dev');
safety.assertDatabaseTarget(process.env.NEXT_PUBLIC_SUPABASE_URL, hosted);
if (!hosted) {
  for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING', 'SUPABASE_DB_URL']) {
    if (process.env[key]) safety.assertLocalPostgresTarget(process.env[key]);
  }
}
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), command, ...process.argv.slice(3)], {
  cwd: root, env: process.env, stdio: 'inherit', windowsHide: true,
});
child.on('error', () => { console.error('Next process could not start'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
