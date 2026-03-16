# Data Model: Net Worth Snapshot MVP

**Branch**: `001-net-worth-snapshot` | **Date**: 2026-03-16

## Collections

### `users`

Single authenticated user per installation.

| Field          | Type     | Constraints                  | Notes                          |
|----------------|----------|------------------------------|--------------------------------|
| `_id`          | ObjectId | PK, auto-generated           |                                |
| `username`     | String   | required, unique, trimmed    | Case-insensitive login         |
| `passwordHash` | String   | required                     | bcryptjs hash, never returned  |
| `createdAt`    | Date     | auto                         |                                |

**Indexes**: `username` (unique)

---

### `accounts`

One document per financial account. Holds both account metadata and current values.

| Field            | Type     | Constraints                              | Notes                                       |
|------------------|----------|------------------------------------------|---------------------------------------------|
| `_id`            | ObjectId | PK, auto-generated                       |                                             |
| `userId`         | ObjectId | required, ref: users                     | All queries filter by userId                |
| `name`           | String   | required, trimmed, max 100 chars         | Display name (e.g. "Fidelity Brokerage")    |
| `type`           | String   | required, enum: cash/stock/crypto/liability |                                          |
| `institutionUrl` | String   | optional, valid URL                      | Opened in new tab during reconciliation     |
| `balance`        | Number   | required for cash/liability, min 0       | USD amount                                  |
| `holdings`       | Array    | required for stock/crypto, see below     |                                             |
| `currentValue`   | Number   | required, derived, stored for perf       | Recalculated on every save                  |
| `createdAt`      | Date     | auto                                     |                                             |
| `updatedAt`      | Date     | auto                                     |                                             |

**Holdings sub-document** (each element in `holdings` array, for stock/crypto only):

| Field          | Type   | Constraints                  | Notes                             |
|----------------|--------|------------------------------|-----------------------------------|
| `ticker`       | String | required, uppercase, trimmed | e.g. AAPL, BTC                    |
| `quantity`     | Number | required, min 0              | Number of shares / units          |
| `pricePerUnit` | Number | required, min 0              | USD price per share/unit          |

`currentValue` for stock/crypto = sum of `quantity × pricePerUnit` across all holdings.
`currentValue` for liability is stored as a positive number; the dashboard subtracts it.

**Indexes**: `userId` (for account list queries)

---

### `activity`

Append-only log of account value snapshots. One document per reconciliation save.

| Field        | Type     | Constraints              | Notes                                    |
|--------------|----------|--------------------------|------------------------------------------|
| `_id`        | ObjectId | PK, auto-generated       |                                          |
| `accountId`  | ObjectId | required, ref: accounts  |                                          |
| `userId`     | ObjectId | required, ref: users     | Redundant but avoids join for graph query|
| `value`      | Number   | required                 | Total account value at this moment (USD) |
| `recordedAt` | Date     | required, default: now   |                                          |

Activity documents are **never updated or deleted** — pure audit trail.

**Indexes**: `userId + recordedAt` (compound, for net worth graph queries)

---

## Relationships

```
users (1) ──────────── (N) accounts
users (1) ──────────── (N) activity
accounts (1) ────────── (N) activity
```

---

## State Transitions

### Account type field

The `type` field is immutable after creation. Changing account type requires deleting
and recreating the account.

### currentValue lifecycle

1. Account created → `currentValue` calculated from initial `balance` or `holdings`
2. Account reconciled → `balance`/`holdings` updated → `currentValue` recalculated
3. Activity snapshot appended with new `currentValue`

---

## Validation Rules

- `balance` field MUST only be present on `cash` and `liability` type accounts
- `holdings` array MUST only be present on `stock` and `crypto` type accounts
- `institutionUrl` when provided MUST be a valid URL (https:// or http://)
- `ticker` values are stored uppercase (e.g. `"btc"` → `"BTC"`)
- Monetary values stored with up to 2 decimal places (round at write time)
