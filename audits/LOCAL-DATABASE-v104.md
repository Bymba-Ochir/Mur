# Mur v104 local database isolation

Base commit: `c4949a16790fb136768bbd2cb058c7f22945e026`. Local repository:
`D:\Mur\mur-mvp`. Production DB was neither queried nor changed.

Implemented:

- Shared public/admin client target and HTTP origin guards; all metadata and
  sitemap clients now use the same factory. Local SDK HTTP redirects disabled.
- Windows/local dev, local production build/start, test and backup protection.
  Hosted access uses Vercel metadata; browser access also requires an allowed
  HTTPS deployment hostname. Local CSP/image loader excludes hosted Supabase.
- Active `.env.local` uses the loopback gateway and the running local stack's
  credentials. Former env is a single ignored private backup, outside the app's
  env loading paths. Vercel OIDC env removed.
- Direct Postgres URI validation rejects connection options that could override
  the host. The backup wrapper clears libpq host and service environment
  overrides before running pg_dump.
- Pinned Supabase CLI `2.122.0`, Docker network loopback binding, local-only
  wrapper commands, no remote CLI flags/connection strings or production tokens.
- 23 historical SQL sources imported as 23 ordered migrations. Root sources and
  applied migrations checksum-locked; CI also compares against its base commit.
  Production HTTP scheduler is explicitly opt-in and skipped on local replay.
- CI production DB secrets removed. Database CI builds/resets a local Supabase
  stack, runs pgTAP and E2E. No automatic production migration/deployment.
- Existing user additions to `.gitignore` preserved; safe template exceptions
  and private local-state ignores added. Existing dependency versions unchanged.

Verification:

- `npm run db:check`: PASS, 23 migrations / 23 historical sources.
- PGlite/PostgreSQL `0.5.14` + actual pgvector and btree_gist: all 23 SQL files
  replay successfully from an empty, locally constructed Supabase schema fixture.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: 55 files / 338 tests PASS.
- `npm run build`: PASS with the running local Supabase configuration.
- Fresh Docker PostgreSQL 17 replay: 23 migration entries verified in
  `supabase_migrations.schema_migrations`.
- `npm run db:test`: PASS, 15 pgTAP checks including the absence of the
  production background schedule. `npm run db:migrate`: already up to date.
- Actual local Auth sign-in, owner write, RLS cross-user isolation, Storage
  upload/download and Realtime subscription passed. Smoke records were cleaned.
- Mur `/api/health` returned HTTP 200 with `database: true` from the local build.
- Git ignores active env and `.local-secrets/before-local-db-v104.env`: verified.

Windows runtime setup:

- The Ubuntu 24.04 VM at `D:\Mur\mur-local-runtime` uses portable QEMU software
  emulation. Its Docker engine and named data volumes persist on its VM disk.
- Windows forwards the guest's services over SSH on 127.0.0.1 only. The Docker
  control port requires a TLS client certificate. Both the listener scope and
  certificate requirement were tested.
- VM mode excludes Studio and its metadata service because Studio requires
  a Windows bind mount. The wrapper waits for the core services to finish
  startup and streams SQL test files to pg_prove inside the VM.
- The reusable Windows launcher is
  `D:\Mur\mur-local-runtime\Start-MurRuntime.ps1`.

Production schema drift/history reconciliation is separate manual work. Never
replay the imported bootstrap history wholesale on the existing production DB.
See [local setup](../docs/LOCAL-DATABASE.md) and [migration workflow](../docs/DATABASE.md).
