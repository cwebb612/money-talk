# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:3033)
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type check without building

# Tests — require a running app + DB for integration
npm run test:integration   # Playwright e2e tests (tests/integration/)
npm run test:unit          # Jest unit tests (tests/unit/)

# Docker — with bundled MongoDB (default)
docker compose up -d       # spins up MongoDB + the app together
docker compose down        # stop

# Docker — bring your own MongoDB
docker compose -f docker-compose.no-mongo.yml up -d   # app only; point MONGO_URL at an external DB
docker compose -f docker-compose.no-mongo.yml down
```

## Environment Variables

### Default setup — bundled MongoDB (`docker-compose.yml`)

Uses `MONGO_USERNAME` / `MONGO_PASSWORD` to initialise MongoDB and build the connection URL internally. Copy `.env.example` to `.env`.

| Variable | Description |
|---|---|
| `MONGO_USERNAME` | MongoDB root username (created on first run) |
| `MONGO_PASSWORD` | MongoDB root password (created on first run) |
| `MONGO_DB_NAME` | Database name |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) |
| `APP_USERNAME` | App login username |
| `APP_PASSWORD` | Plain text password — bcrypt-hashed on first startup, never stored plain |

### External MongoDB setup (`docker-compose.no-mongo.yml`)

Use this when you already have a MongoDB instance running elsewhere. Copy `.env.example.no-mongo` to `.env`.

| Variable | Description |
|---|---|
| `MONGO_URL` | Full connection string (`mongodb://USERNAME:PASSWORD@HOST:PORT`) |
| `MONGO_DB_NAME` | Database name — used as both the target database and auth source |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) |
| `APP_USERNAME` | App login username |
| `APP_PASSWORD` | Plain text password — bcrypt-hashed on first startup, never stored plain |

For local dev, copy the relevant `.env.example` to `.env`. The `.env` file is excluded from the Docker build context.

## Architecture

### Auth flow

- `proxy.ts` guards all `/(app)` routes. It reads the `token` httpOnly cookie and calls `verifyToken`. Unauthenticated requests redirect to `/login`.
- Auth API routes live at `app/api/auth/login` and `app/api/auth/logout`.
- On first DB connection, `lib/db/seed.ts` checks if a user exists; if not, it creates one from `APP_USERNAME` + `APP_PASSWORD`.

### Data model

Four MongoDB collections via Mongoose (`lib/db/models/`):

- **users** — multi-user; username + bcrypt passwordHash + `lastLoginAt`. All users are admins. First user seeded from `APP_USERNAME`/`APP_PASSWORD` env vars; subsequent users created via the Users page.
- **accounts** — `type` enum: `cash | investment | liability`. Cash/liability have a `balance` field. Investment accounts have a `holdings[]` array of `{ticker, quantity, pricePerUnit}`. `currentValue` is derived and stored on every save. Shared across all users — no `userId` scoping.
- **activity** — append-only time-series log. One entry is written every time an account is created or reconciled. Used to build the net worth graph. Never updated or deleted. Shared across all users — no `userId` scoping.
- **apikeys** — API key records: `name`, `key` (plaintext), `prefix` (first 11 chars for display), `lastUsedAt`. Scoped to `userId`.

### Net worth graph

The dashboard aggregates the `activity` collection server-side: for each calendar day, take the latest snapshot per account, then sum assets and subtract liabilities. This produces the `{date, value}[]` array fed to `NetWorthChart` (Recharts `LineChart`).

### Route groups

- `app/(auth)/` — unauthenticated pages (login)
- `app/(app)/` — auth-gated pages with the nav shell layout
- `app/api-doc/` — Scalar API reference UI (public; path starts with `api` so proxy skips it); served as a route handler, not a page
- `app/api/openapi.json/` — serves the OpenAPI spec as JSON; consumed by the Scalar UI
- `app/api/v1/` — public REST API, gated by `X-API-Key` header
- `app/api/keys/` — API key CRUD, gated by session cookie
- `app/api/users/` — user CRUD, gated by session cookie; all authenticated users can manage all users

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
- `lib/swagger.ts` — `getApiDocs()` builds the OpenAPI spec via `next-swagger-doc`; all paths are defined inline in the spec definition (not via JSDoc scanning); `app/api/_docs/routes.ts` is an empty placeholder that satisfies the required `apiFolder` parameter
