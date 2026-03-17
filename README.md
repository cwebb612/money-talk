# Money Talk

A self-hosted personal finance dashboard for tracking net worth over time. Add your accounts, reconcile their values regularly, and watch your money go. Designed to be a high level view of where your money is over time.

![Dashboard Screenshot](https://github.com/cwebb612/money-talk/blob/main/screenshots/dashboard-dark.png)

## Features

- **Net worth dashboard** — line chart of total net worth over time, asset allocation breakdown, and a full account breakdown
- **Four account types** — Cash, Stock, Crypto, and Liability
- **Reconciliation workflow** — each account stores a link to its institution so you can open your bank or brokerage, check the current balance, and update it in one flow; every reconciliation is recorded
- **Pink/Dark modes** — for the girliepops out there that are trying to get their money up.
- **REST API** — read-only endpoints for net worth history, accounts, and account activity; secured with API keys
- **API key management** — create and revoke keys from within the app; interactive API docs at `/api-doc`

---

## Quick Start

### Option 1 — Bundled MongoDB (recommended)

The default `docker-compose.yml` spins up both the app and a MongoDB instance. This is the easiest way to get running.

```bash
cp .env.example .env
# Fill in the values in .env (see below)
docker compose up -d
```

Open `http://localhost:3033` and sign in with your `APP_USERNAME` / `APP_PASSWORD`.

### Option 2 — External MongoDB

If you already have a MongoDB instance running elsewhere, use `docker-compose.no-mongo.yml` and point it at your existing database.

```bash
cp .env.example.no-mongo .env
# Fill in MONGO_URL and the rest of the values (see below)
docker compose -f docker-compose.no-mongo.yml up -d
```

### Option 3 — Local Build

If you have the repo pulled down, and a MongoDB instance running elsewhere, use `docker-compose.local.yml` to build the repo itself instead of pulling the image from docker hub.

```bash
cp .env.example.no-mongo .env
# Fill in MONGO_URL and the rest of the values (see below)
docker compose -f docker-compose.local.yml up -d --build
```

---

## Environment Variables

### `.env` — default setup (bundled MongoDB)

Copy `.env.example` to `.env`.

| Variable | Description |
|---|---|
| `MONGO_USERNAME` | MongoDB root username — created on first run |
| `MONGO_PASSWORD` | MongoDB root password — created on first run |
| `MONGO_DB_NAME` | Database name |
| `JWT_SECRET` | Secret for signing session tokens — min 32 chars, see below |
| `APP_USERNAME` | App login username |
| `APP_PASSWORD` | Login password — bcrypt-hashed on first startup, never stored plain |

```env
MONGO_USERNAME=admin
MONGO_PASSWORD=changeme
MONGO_DB_NAME=moneytalk
JWT_SECRET=change-this-to-a-long-random-string-min-32-chars
APP_USERNAME=admin
APP_PASSWORD=changeme
```

### `.env` — external MongoDB setup

Copy `.env.example.no-mongo` to `.env`.

| Variable | Description |
|---|---|
| `MONGO_URL` | Full connection string — `mongodb://USERNAME:PASSWORD@HOST:PORT` |
| `MONGO_DB_NAME` | Database name — used as both target database and auth source |
| `JWT_SECRET` | Secret for signing session tokens — min 32 chars, see below |
| `APP_USERNAME` | App login username |
| `APP_PASSWORD` | Login password — bcrypt-hashed on first startup, never stored plain |

```env
MONGO_URL=mongodb://USERNAME:PASSWORD@HOST:PORT
MONGO_DB_NAME=moneytalk
JWT_SECRET=change-this-to-a-long-random-string-min-32-chars
APP_USERNAME=admin
APP_PASSWORD=changeme
```

### Generating a JWT_SECRET

```bash
# macOS / Linux
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Paste the output as your `JWT_SECRET`. Keep it private — anyone with this value can forge login sessions.

---

## Docker Compose Commands

```bash
# Default — bundled MongoDB
docker compose up -d
docker compose down
docker compose down -v          # also deletes the MongoDB data volume

# External MongoDB
docker compose -f docker-compose.no-mongo.yml up -d
docker compose -f docker-compose.no-mongo.yml down

# View logs
docker compose logs -f money-talk

# Rebuild after a code change
docker compose up -d --build
```

---

## Local Development

Requires Node.js 22+ and a running MongoDB instance.

```bash
cp .env.example.no-mongo .env
# Edit .env — set MONGO_URL to your local MongoDB

npm install
npm run dev        # http://localhost:3033
```

Other dev commands:

```bash
npm run build        # production build
npm run start        # start production build
npm run lint         # ESLint
npx tsc --noEmit     # type check without building
```

---

## The App

### Dashboard

The home screen shows:

- **Net worth card** — current total with a line chart of history
- **Asset allocation** — pie chart of assets broken down by account type
- **Account list** — all accounts with current values and quick-reconcile links

### Account Types

| Type | How value is tracked |
|---|---|
| **Cash** | Single balance field (e.g. checking, savings) |
| **Stock** | Holdings list of `ticker / quantity / price per unit` |
| **Crypto** | Holdings list of `ticker / quantity / price per unit` |
| **Liability** | Single balance field; subtracted from net worth (e.g. mortgage, loan) |

### Reconciliation

Each account stores an optional institution URL. The intended workflow is:

1. Open the account page in Money Talk
2. Click the institution link to open your bank or brokerage in a new tab
3. Check the current balance or prices
4. Update the value in Money Talk and save

Every save writes a new record to the activity log. This is what builds the net worth history graph over time — no data is ever overwritten.

For investment accounts, there is also a **Refresh Prices** button that fetches current market prices automatically.

### Users

All users are admins. Manage users from the account menu (top-right corner) → **Users**. The first user is created automatically on startup from `APP_USERNAME` / `APP_PASSWORD`. Additional users can be created from within the app.

To reset a password, update `APP_PASSWORD` in your `.env` and delete the user document from the `users` MongoDB collection, then restart — the user will be re-seeded.

---

## REST API

The API is read-only and secured with API keys. Create keys from the account menu → **API Keys**.

Interactive documentation is available at `/api-doc`.

### Authentication

Pass your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: mt_your_key_here" http://localhost:3033/api/v1/accounts
```

### Endpoints

#### Data endpoints — require `X-API-Key`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check — no auth required |
| `GET` | `/api/v1/accounts` | All accounts with current values |
| `GET` | `/api/v1/accounts/:id/activity` | Reconciliation history for one account |
| `GET` | `/api/v1/net-worth` | Daily net worth history. Optional `?from=YYYY-MM-DD` / `?to=YYYY-MM-DD` filters |

#### Key management — require browser session

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/keys` | List API keys (prefix and metadata only — full key is never re-shown) |
| `POST` | `/api/keys` | Create a key. Body: `{ "name": "label" }`. Full key returned once. |
| `DELETE` | `/api/keys/:id` | Revoke a key immediately |

---

## Tests

Integration tests require the app and a database to be running.

```bash
npm run test:unit          # Jest unit tests
npm run test:integration   # Playwright e2e tests (requires running app)
```

---

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **MongoDB 8** via **Mongoose**
- **Recharts** — net worth line chart and pie charts
- **Tailwind CSS v4** with CSS variables for theming
- **bcryptjs** + **jose** — authentication and session tokens
- **next-swagger-doc** + **Scalar** — API documentation
- **Playwright** (integration tests) + **Jest** (unit tests)
