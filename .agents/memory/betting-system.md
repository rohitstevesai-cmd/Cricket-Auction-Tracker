---
name: Betting System Architecture
description: Architecture decisions for the SPL Online Batting feature added to cricket auction app
---

# Betting System

## Auth
- Session-based using `express-session` (cookie: `connect.sid`)
- Passwords hashed with `bcryptjs`
- Admin creds hardcoded: email `admin6261@gmail.com`, password `Admin@6261`
- Session stores `bettingUserId` (string) or `bettingAdminLoggedIn` (boolean)

## DB Tables (lib/db/src/schema/betting.ts)
- `betting_users` — email/password/balance
- `betting_transactions` — add/withdraw requests with status (pending/approved/cancelled)
- `betting_matches` — upcoming/live/completed matches with winner field
- `betting_bets` — user bets linked to matches

## API Routes
All under `/api/betting/`:
- Auth: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`
- User wallet: `/transactions` (GET), `/transactions/add` (POST), `/transactions/withdraw` (POST)
- Bets: `/bets` (GET/POST)
- Matches: `/matches` (GET public)
- Admin: `/admin/transactions`, `/admin/users`, `/admin/matches`, `/admin/bets`
- Admin actions: `PUT /admin/transactions/:id`, `PUT /admin/users/:id/balance`, `POST /admin/matches/:id/winner`

## Frontend Routes
- `/betting` — BettingDashboard (user, requires login)
- `/betting-admin` — BettingAdmin (admin only)

## Betting Rules
- Minimum bet: ₹10
- Minimum withdrawal: ₹100
- Bets cannot be cancelled once placed
- Winner declared: 2x payout for winners, draw = full refund
- Withdrawal deducts balance immediately (pending approval from admin)

**Why:** Keeps betting logic backend-only; balance never goes negative.
