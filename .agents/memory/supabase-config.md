---
name: Supabase hardcoded config
description: This project always uses Supabase via config.ts — never Replit built-in DB or env vars.
---

# Supabase Hardcoded Config Rule

**Rule:** Always import DB credentials from `config.ts` at the repo root. Never use `process.env.DATABASE_URL` or Replit's built-in PostgreSQL.

**Why:** User explicitly wants the same Supabase DB to be used regardless of which Replit account or environment the repo runs on. Hardcoded credentials in `config.ts` guarantee consistency across all forks/clones.

**How to apply:**
- `lib/db/src/index.ts` — imports `supabaseConfig.databaseUrl` from `../../../config`
- `lib/db/drizzle.config.ts` — imports `supabaseConfig.databaseUrl` from `../../config`
- Never replace these imports with `process.env.DATABASE_URL`
- Never delete or modify `config.ts`
- To push schema changes: `pnpm --filter @workspace/db run push` (uses config.ts automatically)
