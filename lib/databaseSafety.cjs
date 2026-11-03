const LOCAL_API_PORT = '54321';
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

/** @param {string} hostname */
function isLocalPage(hostname) {
  const host = hostname.toLowerCase();
  return LOOPBACK.has(host) || host === '0.0.0.0' || !host.includes('.')
    || ['.localhost','.local','.test','.internal','.lan'].some(suffix => host.endsWith(suffix))
    || /^(127\.|169\.254\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
    || /^\[(?:f[cd]|fe[89ab])/i.test(host);
}

/** Hosted access is enabled by Vercel deployment metadata, never NODE_ENV. */
function allowsHostedDatabase() {
  if (typeof window !== 'undefined') {
    const hosts = (process.env.NEXT_PUBLIC_DATABASE_HOSTS || '').split(',');
    return process.env.NEXT_PUBLIC_DATABASE_MODE === 'hosted' && window.location.protocol === 'https:'
      && !isLocalPage(window.location.hostname) && hosts.includes(window.location.hostname);
  }
  return process.platform !== 'win32' && process.env.MUR_FORCE_LOCAL_DB !== '1' && process.env.VERCEL === '1'
    && ['preview', 'production'].includes(process.env.VERCEL_ENV || '');
}

/** @param {unknown} value @param {boolean} [hosted] @param {boolean} [request] */
function assertDatabaseTarget(value, hosted = allowsHostedDatabase(), request = false) {
  let url;
  try { url = new URL(typeof value === 'string' ? value : ''); } catch {
    throw new Error('DATABASE_TARGET_INVALID: Supabase URL тохируулаагүй байна.');
  }
  if (url.username || url.password || (!request && url.search) || url.hash) throw new Error('DATABASE_TARGET_INVALID: URL credentials/query are forbidden.');
  const local = url.protocol === 'http:' && LOOPBACK.has(url.hostname) && url.port === LOCAL_API_PORT;
  if (!local && !hosted) {
    throw new Error('LOCAL_DATABASE_REQUIRED: Local code may only use http://127.0.0.1:54321. Run npm run db:start.');
  }
  if (!local && url.protocol !== 'https:') throw new Error('DATABASE_TARGET_INVALID: Hosted Supabase requires HTTPS.');
  return url;
}

/** Direct Postgres tools are always local, including local NODE_ENV=production. @param {unknown} value */
function assertLocalPostgresTarget(value) {
  // libpq URI parameters can override the host and port in the authority.
  if (typeof value !== 'string' || /[\s?#]/.test(value)) {
    throw new Error('LOCAL_POSTGRES_REQUIRED: Use a local PostgreSQL URI without connection options.');
  }
  let url;
  try { url = new URL(value); } catch {
    throw new Error('LOCAL_POSTGRES_REQUIRED: Configure the local database first.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !LOOPBACK.has(url.hostname) || url.port !== '54322') {
    throw new Error('LOCAL_POSTGRES_REQUIRED: Remote PostgreSQL connections are forbidden in local tools.');
  }
  return url;
}

module.exports = { allowsHostedDatabase, assertDatabaseTarget, assertLocalPostgresTarget, isLocalPage };
