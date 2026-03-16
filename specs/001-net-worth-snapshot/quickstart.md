# Quickstart: Net Worth Snapshot MVP

**Branch**: `001-net-worth-snapshot`

## Prerequisites

- Docker + Docker Compose installed
- Node.js 20+ (for local development without Docker)

---

## Running with Docker (recommended for self-hosting)

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your values:
   ```env
   MONGODB_URI=mongodb://mongo:27017/money-talk
   JWT_SECRET=change-this-to-a-long-random-string
   APP_USERNAME=yourname
   APP_PASSWORD=yourpassword
   ```

3. Start the stack:
   ```bash
   docker compose up -d
   ```

4. Open `http://localhost:3000` and log in.

To stop:
```bash
docker compose down
```

MongoDB data persists in a named Docker volume (`money-talk-mongo-data`).

---

## Local Development (without Docker)

1. Start a local MongoDB instance (or point at MongoDB Atlas):
   ```bash
   # Using Docker just for MongoDB:
   docker run -d -p 27017:27017 --name mongo mongo:7
   ```

2. Copy and configure `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/money-talk
   JWT_SECRET=dev-secret-change-in-production
   APP_USERNAME=admin
   APP_PASSWORD=password
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

---

## Environment Variables

| Variable       | Required | Description                                          |
|----------------|----------|------------------------------------------------------|
| `MONGODB_URI`  | Yes      | MongoDB connection string                            |
| `JWT_SECRET`   | Yes      | Secret for signing JWT tokens (min 32 chars)         |
| `APP_USERNAME` | Yes      | Login username for the single user                   |
| `APP_PASSWORD` | Yes      | Login password for the single user (stored as hash)  |

**Important**: `APP_PASSWORD` in `.env` is the **plain text** password. At startup, the
app checks if the user document exists in MongoDB; if not, it creates one with a bcrypt
hash of `APP_PASSWORD`. The plain text password is never stored.

---

## Validation Checklist (after setup)

- [ ] Dashboard loads at `/` and shows net worth (or prompt to add first account)
- [ ] Can create a Cash account and see it in the breakdown
- [ ] Can create a Stock account with holdings and see calculated value
- [ ] Can reconcile an account and see the graph update
- [ ] Institution link opens in new tab
- [ ] Logging out redirects to `/login`
- [ ] After logout, accessing `/` redirects to `/login`

---

## Running Tests

```bash
# Integration tests (requires running app + DB)
npm run test:integration

# Unit tests (pure functions only)
npm run test:unit
```
