# Money Talk

A self-hosted personal finance dashboard focused on net worth tracking. Log in, reconcile your accounts one by one using each institution's link, and watch your net worth graph grow over time.

## Features

- **Net worth dashboard** — line chart of net worth history, account breakdown by type
- **Four account types** — Cash, Stock, Crypto, Liability
- **Reconciliation workflow** — each account stores an institution link so you can open your bank/brokerage, check the current value, and update it in one flow
- **Activity log** — every reconciliation is recorded; the graph is built from this history
- **Single-user auth** — simple username/password with bcrypt + JWT

## Running with Docker (recommended)

```bash
cp .env.example .env
# edit .env with your values
docker compose up -d
```

Open `http://localhost:3000` and log in with the credentials from your `.env`.

MongoDB data persists in a named Docker volume (`money-talk-mongo-data`).

```bash
docker compose down        # stop
docker compose down -v     # stop and delete data volume
```

## Local Development

Requires Node.js 20+ and a running MongoDB instance.

```bash
# Start MongoDB via Docker (if you don't have one running)
docker run -d -p 27017:27017 --name mongo mongo:7

cp .env.example .env
# edit .env — set MONGO_URL to mongodb://localhost:27017/money-talk

npm install
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing session tokens (min 32 chars) |
| `APP_USERNAME` | Yes | Login username |
| `APP_PASSWORD` | Yes | Login password — hashed with bcrypt on first startup, never stored plain |

On first startup the app checks whether a user document exists in MongoDB. If not, it creates one from `APP_USERNAME` and `APP_PASSWORD`. To change credentials, update `.env` and delete the user document from the `users` collection.

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
