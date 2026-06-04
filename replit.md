# Cricket Auction Tracker & Betting System

A full-stack Cricket Player Auction Tracker with a live betting platform where users can bet on matches using virtual balances.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to Supabase

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL (Supabase) + Drizzle ORM
- Storage: Supabase Storage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Database — IMPORTANT

**This project always uses Supabase — never Replit's built-in database.**

All credentials are hardcoded in `config.ts` at the root of the repo. Do NOT remove or replace these credentials with Replit's `DATABASE_URL` or any other env var. This rule applies in every environment (development, production) and on every Replit account this repo is cloned/forked to.

- `config.ts` is the single source of truth for Supabase credentials.
- `lib/db/src/index.ts` imports directly from `config.ts` — never from `process.env.DATABASE_URL`.
- `lib/db/drizzle.config.ts` imports directly from `config.ts` — never from env vars.

## Where things live

- `config.ts` — Supabase credentials (URL, anon key, database URL) — **do not delete or modify**
- `lib/db/src/schema/index.ts` — DB schema (players, teams)
- `lib/db/src/schema/betting.ts` — Betting tables (users, matches, bets, transactions)
- `artifacts/api-server/src/` — Express API routes
- `artifacts/cricket-auction/src/` — React frontend

## Architecture decisions

- Supabase PostgreSQL is hardcoded via `config.ts` — intentional, so the same DB is used regardless of Replit account or environment.
- Session-based auth with bcryptjs + express-session (no external auth provider).
- Admin credentials are hardcoded in `artifacts/api-server/src/routes/betting-auth.ts`.
- API runs on port 8080; frontend Vite dev server on port 18246 and proxies `/api` to port 8080.

## Product

- Cricket player auction management (add/manage players, teams, points)
- Live betting on matches with virtual balance
- Admin panel for managing transactions, matches, and users

## User preferences

- Always use Supabase for the database — never Replit built-in DB.
- Supabase credentials must remain hardcoded in `config.ts` — do not move to env vars.
- When cloning to any new Replit account, keep `config.ts` credentials as-is.

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after schema changes to sync Supabase.
- Do NOT run `pnpm --filter @workspace/db run push` against Replit DB — it uses `config.ts` which points to Supabase.
- Never replace `config.ts` imports in `lib/db/` with `process.env.DATABASE_URL`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
