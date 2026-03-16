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
docker compose up -d       # build and start the app (env vars must be set in the host shell)
docker compose down        # stop
```

## Environment Variables

Required vars:

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string (`mongodb://USERNAME:PASSWORD@IP:PORT`) |
| `MONGO_DB_NAME` | MongoDB database name — used as both the target database and auth source |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) |
| `APP_USERNAME` | Login username |
| `APP_PASSWORD` | Plain text password — bcrypt-hashed on first startup, never stored plain |

For local dev, copy `.env.example` to `.env`. For Docker, export these vars in your shell before running `docker compose up` — the compose file reads them from the host environment and injects them at runtime. The `.env` file is excluded from the Docker build context.

## Architecture

### Auth flow

- `proxy.ts` guards all `/(app)` routes. It reads the `token` httpOnly cookie and calls `verifyToken`. Unauthenticated requests redirect to `/login`.
- Auth API routes live at `app/api/auth/login` and `app/api/auth/logout`.
- On first DB connection, `lib/db/seed.ts` checks if a user exists; if not, it creates one from `APP_USERNAME` + `APP_PASSWORD`.

### Data model

Four MongoDB collections via Mongoose (`lib/db/models/`):

- **users** — single-user app; username + bcrypt passwordHash
- **accounts** — `type` enum: `cash | stock | crypto | liability`. Cash/liability have a `balance` field. Stock/crypto have a `holdings[]` array of `{ticker, quantity, pricePerUnit}`. `currentValue` is derived and stored on every save.
- **activity** — append-only time-series log. One entry is written every time an account is created or reconciled. Used to build the net worth graph. Never updated or deleted.
- **apikeys** — API key records: `name`, `keyHash` (SHA256 of the raw key), `prefix` (first 11 chars for display), `lastUsedAt`. Full key is never stored.

### Net worth graph

The dashboard aggregates the `activity` collection server-side: for each calendar day, take the latest snapshot per account, then sum assets and subtract liabilities. This produces the `{date, value}[]` array fed to `NetWorthChart` (Recharts `LineChart`).

### Route groups

- `app/(auth)/` — unauthenticated pages (login)
- `app/(app)/` — auth-gated pages with the nav shell layout
- `app/api-doc/` — Swagger UI (public; path starts with `api` so proxy skips it)
- `app/api/v1/` — public REST API, gated by `X-API-Key` header
- `app/api/keys/` — API key CRUD, gated by session cookie

### DB connection

`lib/db/mongodb.ts` uses a module-level cached promise (`global._mongooseConnection`) to survive Next.js hot-reload without opening multiple connections.

### Styling

All colors are CSS variables defined in `app/globals.css`:
- `--color-bg` `#111111` — page background
- `--color-card` `#1c1c1e` — card/surface background
- `--color-border` `#2c2c2e` — subtle borders and dividers
- `--color-blue` `#3b82f6` — accent only (focus rings, highlights); not used as a background
- `--color-yellow` `#f59e0b` — primary accent (CTAs, key values)
- `--color-text` `#f5f5f7`, `--color-muted` `#6b7280`

Use these variables for all new UI rather than hardcoding hex values.

### Key utilities

- `lib/utils/money.ts` — `calculateAccountValue(account)` (pure, no DB) and `formatUSD(value)`
- `lib/auth/session.ts` — `signToken`, `verifyToken`, `setSessionCookie`, `clearSessionCookie`
- `lib/auth/password.ts` — `hashPassword`, `comparePassword` (bcryptjs, saltRounds: 10)
- `lib/auth/apiKey.ts` — `generateApiKey()`, `hashApiKey()`, `validateApiKey(request)` (SHA256-based)
- `lib/swagger.ts` — `getApiDocs()` builds the OpenAPI spec via `next-swagger-doc`; JSDoc `@swagger` annotations live in the route files themselves
