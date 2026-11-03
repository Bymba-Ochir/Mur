import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import safety from '../lib/databaseSafety.cjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2];
const args = process.argv.slice(3);
const require = createRequire(import.meta.url);
const cli = require.resolve('supabase/dist/supabase.js');
const localUrl = 'http://127.0.0.1:54321';
const hostEnv = process.platform === 'win32'
  ? Object.fromEntries(Object.entries(process.env).map(([name, value]) => [name.toUpperCase(), value]))
  : process.env;
const env = { ...hostEnv, SUPABASE_ACCESS_TOKEN: '', SUPABASE_DB_PASSWORD: '', MUR_FORCE_LOCAL_DB: '1', DO_NOT_TRACK: '1' };
for (const name of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING','SUPABASE_DB_URL','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','PGHOST','PGHOSTADDR','PGPORT','PGDATABASE','PGUSER','PGPASSWORD','PGSERVICE','PGSERVICEFILE','PGSYSCONFDIR','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[name];
env.DOCKER_HOST = 'unix:///var/run/docker.sock';
if (process.platform === 'win32') {
  env.PATH = [join(process.env.ProgramFiles || 'C:/Program Files','Docker/Docker/resources/bin'),
    join(process.env.LOCALAPPDATA || '', 'Programs/DockerDesktop/resources/bin'), env.PATH].join(';');
  env.DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine';
  const certPath = resolve(root, '..', 'mur-local-runtime', 'docker-certs');
  if (['ca.pem', 'cert.pem', 'key.pem'].every(name => existsSync(join(certPath, name)))) {
    env.DOCKER_HOST = 'tcp://127.0.0.1:23761';
    env.DOCKER_TLS_VERIFY = '1';
    env.DOCKER_CERT_PATH = certPath;
  }
}

function run(binary, parameters, capture = false, input) {
  const result = spawnSync(binary, parameters, {
    cwd: root, env, encoding: 'utf8', windowsHide: true,
    stdio: capture ? 'pipe' : [input ? 'pipe' : 'inherit', 'inherit', 'inherit'],
    input, maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    if (capture && result.stderr) {
      const privateDir = join(root, '.local-secrets');
      mkdirSync(privateDir, { recursive: true, mode: 0o700 });
      writeFileSync(join(privateDir, 'last-local-db-error.log'), result.stderr, { mode: 0o600 });
      throw new Error('Local database command failed. See the private .local-secrets/last-local-db-error.log.');
    }
    throw new Error('Local database command failed. Check the local Docker runtime and the output above.');
  }
  return result.stdout || '';
}
const usesVmDocker = env.DOCKER_HOST === 'tcp://127.0.0.1:23761';
const vmServices = ['db', 'kong', 'auth', 'rest', 'realtime', 'storage', 'inbucket'];

async function waitForVmServices() {
  const deadline = Date.now() + 5 * 60_000;
  const names = vmServices.map(service => `supabase_${service}_mur-local`);
  const format = '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}';
  let states;
  do {
    states = run('docker', ['inspect', '--format', format, ...names], true).trim().split(/\r?\n/);
    if (states.length === names.length && states.every(state => state === 'healthy' || state === 'running')) return;
    await delay(5000);
  } while (Date.now() < deadline);
  const pending = vmServices.filter((_, index) => !['healthy', 'running'].includes(states[index]));
  throw new Error(`Local VM service health timed out: ${pending.join(', ')}`);
}

function supabase(parameters, capture = false) {
  return run(process.execPath, [cli, ...parameters, '--workdir', root, '--network-id', 'mur-local', '--agent', 'no'], capture);
}

function testVmDatabase() {
  const status = JSON.parse(supabase(['status', '--output', 'json'], true));
  const database = safety.assertLocalPostgresTarget(status.DB_URL);
  const tests = spawnSync('tar', ['-cf', '-', '-C', join(root, 'supabase', 'tests'), '.'], {
    cwd: root, env, windowsHide: true, maxBuffer: 16 * 1024 * 1024,
  });
  if (tests.error || tests.status !== 0) throw new Error('Could not archive local database tests.');
  const command = 'mkdir -p /tmp/mur-tests && tar -xf - -C /tmp/mur-tests && pg_prove --recurse --ext .sql -h supabase_db_mur-local -U postgres -d postgres /tmp/mur-tests';
  run('docker', [
    'run', '--rm', '-i', '--network', 'mur-local', '--entrypoint', 'sh',
    '--env', `PGPASSWORD=${decodeURIComponent(database.password)}`,
    'public.ecr.aws/supabase/pg_prove:3.36', '-ec', command,
  ], false, tests.stdout);
}

function configure(values, prepare = false) {
  if (!prepare && (!values.API_URL || !values.DB_URL || !(values.ANON_KEY || values.PUBLISHABLE_KEY) || !(values.SERVICE_ROLE_KEY || values.SECRET_KEY))) {
    throw new Error('Local CLI status is missing connection fields; refusing to write incomplete credentials.');
  }
  safety.assertDatabaseTarget(values.API_URL || localUrl, false);
  const postgres = values.DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  safety.assertLocalPostgresTarget(postgres);
  const path = join(root, '.env.local');
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const backup = join(root, '.local-secrets', 'before-local-db-v104.env');
  if (previous && !existsSync(backup)) {
    mkdirSync(dirname(backup), { recursive: true, mode: 0o700 });
    copyFileSync(path, backup); chmodSync(backup, 0o600);
  }
  const forbidden = /^(?:NEXT_PUBLIC_DATABASE_\w+|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_URL|SUPABASE_ANON_KEY|DATABASE_URL|POSTGRES_\w+|SUPABASE_DB_URL|NEXT_PUBLIC_SITE_URL|VERCEL\w*|MUR_FORCE_LOCAL_DB)\s*=/;
  const retained = previous.split(/\r?\n/).filter(line => !forbidden.test(line.trim()));
  const overrides = {
    NEXT_PUBLIC_DATABASE_MODE: 'local', NEXT_PUBLIC_SUPABASE_URL: localUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY || values.PUBLISHABLE_KEY || 'local-not-started',
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY || values.SECRET_KEY || 'local-not-started',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', DATABASE_URL: postgres,
  };
  for (const key of ['CRON_SECRET','NOTIFY_WEBHOOK_SECRET']) {
    if (!retained.some(line => line.startsWith(key + '=') && line.length > key.length + 1)) overrides[key] = randomBytes(24).toString('hex');
  }
  writeFileSync(path, retained.join('\n').trimEnd() + '\n\n# Local database only — generated by npm run db:start\n'
    + Object.entries(overrides).map(([key,value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n', { mode: 0o600 });
  console.log('Local .env.local configured for 127.0.0.1 only. No keys were printed.');
}

try {
  if (command === 'prepare' && !args.length) configure({}, true);
  else if (command === 'start' && !args.length) {
    // Publish ports only on loopback; do not expose Auth/DB/Studio to the LAN.
    const inspect = spawnSync('docker', ['network','inspect','mur-local'], { cwd: root, env, windowsHide: true, encoding: 'utf8', stdio: 'pipe' });
    if (inspect.status !== 0) run('docker',['network','create','-o','com.docker.network.bridge.host_binding_ipv4=127.0.0.1','mur-local']);
    else if (JSON.parse(inspect.stdout)[0]?.Options?.['com.docker.network.bridge.host_binding_ipv4'] !== '127.0.0.1') {
      throw new Error('Existing mur-local Docker network is not loopback-only. Refusing to expose the database.');
    }
    // Studio needs a Windows bind mount, and the VM needs longer to warm up.
    if (usesVmDocker) {
      supabase(['start', '--exclude', 'studio,postgres-meta', '--ignore-health-check'], true);
      await waitForVmServices();
    } else supabase(['start'], true);
    configure(JSON.parse(supabase(['status','--output','json'], true)));
  } else if (command === 'stop' && !args.length) supabase(['stop']);
  else if (command === 'status' && !args.length) {
    const values = JSON.parse(supabase(['status','--output','json'], true));
    safety.assertDatabaseTarget(values.API_URL, false); safety.assertLocalPostgresTarget(values.DB_URL);
    console.log('Local Supabase is running: API 127.0.0.1:54321, DB 127.0.0.1:54322.');
  } else if (command === 'reset' && !args.length) supabase(['db','reset','--local']);
  else if (command === 'migrate' && !args.length) supabase(['migration','up','--local']);
  else if (command === 'test' && !args.length) {
    if (usesVmDocker) testVmDatabase();
    else supabase(['test','db','--local']);
  }
  else if (['new','diff'].includes(command) && args.length === 1 && /^[a-z][a-z0-9_]{1,80}$/.test(args[0])) {
    supabase(command === 'new' ? ['migration','new',args[0]] : ['db','diff','--local','-f',args[0]]);
  } else throw new Error('Only local commands are allowed: prepare/start/stop/status/reset/migrate/new/diff. Remote targets and extra flags are forbidden.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local database command failed'); process.exitCode = 1;
}
