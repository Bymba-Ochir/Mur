const { assertLocalPostgresTarget } = require('../lib/databaseSafety.cjs');
try { assertLocalPostgresTarget(process.env.DATABASE_URL); }
catch { console.error('LOCAL_POSTGRES_REQUIRED: backup scripts only accept localhost:54322.'); process.exitCode = 1; }
