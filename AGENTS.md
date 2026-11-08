<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Database isolation and migrations

- Local dev, builds, tests, backup tools and migration commands must use only
  `127.0.0.1:54321` (API) / `127.0.0.1:54322` (Postgres). Never connect local code
  to a hosted production database, even for a schema dump or read-only test.
- Use the shared Supabase client factories and `databaseSafety.cjs`; do not add
  direct SDK constructors or bypass their target/fetch guards.
- Every schema, RLS, RPC, trigger, constraint, index and reference-data change
  must be a new `supabase/migrations/<timestamp>_<name>.sql` migration.
- Applied migrations and historical SQL under `supabase/legacy/` are immutable. Use a new
  forward migration to change or repair them. Run `npm run db:check`.
- Local DB commands go through `npm run db:*`. Never add `--linked`, remote
  connection URLs, production project refs or automatic production DB deploys.
- Validate migrations against a fresh local DB (`db:reset`, `db:test`). Do not
  replay the imported history on the existing production database. Production
  baseline reconciliation and SQL execution are separate manual work.
