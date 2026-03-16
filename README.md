# Money Talk

A self-hosted personal finance dashboard focused on net worth tracking. Log in, reconcile your accounts one by one using each institution's link, and watch your net worth graph grow over time.

## Features

- **Net worth dashboard** — line chart of net worth history, account breakdown by type
- **Four account types** — Cash, Stock, Crypto, Liability
- **Reconciliation workflow** — each account stores an institution link so you can open your bank/brokerage, check the current value, and update it in one flow
- **Activity log** — every reconciliation is recorded; the graph is built from this history
- **Single-user auth** — simple username/password with bcrypt + JWT, 8-hour sessions
- **Light/dark mode** — toggle in the account menu

## Running with Docker (recommended)

Environment variables must be set in your shell before running. Docker reads them from the host environment at both build and run time — no `.env` file is used by Docker.

```bash
export MONGO_URL=mongodb://user:pass@host:27017
export MONGO_DB_NAME=money-talk
export JWT_SECRET=<see below>
export APP_USERNAME=yourname
export APP_PASSWORD=yourpassword

docker compose up -d
```

Open `http://localhost:3000` and log in with your `APP_USERNAME` / `APP_PASSWORD`.

```bash
docker compose down        # stop
docker compose down -v     # stop and delete data volume
```

## Local Development

Requires Node.js 22+ and a running MongoDB instance.

```bash
cp .env.example .env
# edit .env with your values

npm install
npm run dev
```

For local dev the app loads variables from `.env` automatically via Next.js.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string (`mongodb://user:pass@host:port`) |
| `MONGO_DB_NAME` | MongoDB database name — used as both target database and auth source |
| `JWT_SECRET` | Secret for signing session tokens — min 32 chars, see below |
| `APP_USERNAME` | Login username |
| `APP_PASSWORD` | Login password — bcrypt-hashed on first startup, never stored plain |

On first startup the app checks whether a user document exists in MongoDB. If not, it creates one from `APP_USERNAME` and `APP_PASSWORD`. To change credentials, update the values and delete the user document from the `users` collection.

### Generating a secure JWT_SECRET


```bash
# openssl (available on macOS/Linux)
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

The output is a random 64-character string. Paste it as your `JWT_SECRET`. Keep it private — anyone with this value can forge login sessions.

## Tests

Integration tests require the app and a database to be running.

```bash
npm run test:integration   # Playwright e2e (tests/integration/)
npm run test:unit          # Jest unit tests (tests/unit/)
```

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **MongoDB 7** via **Mongoose**
- **Recharts** for the net worth line chart
- **bcryptjs** + **jose** for auth
- **Tailwind CSS v4** with CSS variables for theming
- **Playwright** (integration) + **Jest** (unit)
