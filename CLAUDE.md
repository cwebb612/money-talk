# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type check without building

# Tests — require a running app + DB for integration
npm run test:integration   # Playwright e2e tests (tests/integration/)
npm run test:unit          # Jest unit tests (tests/unit/)

# Docker
docker compose up -d       # start app + MongoDB
docker compose down        # stop
```

## Environment Variables

All config lives in `.env` at the repo root. Required vars:

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string (`mongodb://USERNAME:PASSWORD@IP:PORT/db-name`) |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) |
| `APP_USERNAME` | Login username |
| `APP_PASSWORD` | Plain text password — bcrypt-hashed on first startup, never stored plain |

Copy `.env.example` to `.env` to get started.

## Architecture

### Auth flow

- `proxy.ts` (Next.js 16 proxy — replaces `middleware.ts`) guards all `/(app)` routes. It reads the `token` httpOnly cookie and calls `verifyToken`. Unauthenticated requests redirect to `/login`.
- Auth API routes live at `app/api/auth/login` and `app/api/auth/logout`.
- On first DB connection, `lib/db/seed.ts` checks if a user exists; if not, it creates one from `APP_USERNAME` + `APP_PASSWORD`.

### Data model

Three MongoDB collections via Mongoose (`lib/db/models/`):

- **users** — single-user app; username + bcrypt passwordHash
- **accounts** — `type` enum: `cash | stock | crypto | liability`. Cash/liability have a `balance` field. Stock/crypto have a `holdings[]` array of `{ticker, quantity, pricePerUnit}`. `currentValue` is derived and stored on every save.
- **activity** — append-only time-series log. One entry is written every time an account is created or reconciled. Used to build the net worth graph. Never updated or deleted.

### Net worth graph

The dashboard aggregates the `activity` collection server-side: for each calendar day, take the latest snapshot per account, then sum assets and subtract liabilities. This produces the `{date, value}[]` array fed to `NetWorthChart` (Recharts `LineChart`).

### Route groups

- `app/(auth)/` — unauthenticated pages (login)
- `app/(app)/` — auth-gated pages with the nav shell layout

### DB connection

`lib/db/mongodb.ts` uses a module-level cached promise (`global._mongooseConnection`) to survive Next.js hot-reload without opening multiple connections.

### Styling

All colors are CSS variables defined in `app/globals.css`:
- `--color-bg` `#1a1a2e`, `--color-card` `#16213e`, `--color-blue` `#2e2d50`
- `--color-yellow` `#ffbd44` (primary accent), `--color-text` `#e0e0e0`, `--color-muted` `#888`

Use these variables for all new UI rather than hardcoding hex values.

### Key utilities

- `lib/utils/money.ts` — `calculateAccountValue(account)` (pure, no DB) and `formatUSD(value)`
- `lib/auth/session.ts` — `signToken`, `verifyToken`, `setSessionCookie`, `clearSessionCookie`
- `lib/auth/password.ts` — `hashPassword`, `comparePassword` (bcryptjs, saltRounds: 10)
