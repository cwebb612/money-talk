# API Contracts: Net Worth Snapshot MVP

**Branch**: `001-net-worth-snapshot` | **Date**: 2026-03-16
**Base path**: All routes under `/api/`
**Auth**: All routes except `/api/auth/login` require a valid JWT in `token` httpOnly cookie.
Unauthorized requests return `401`.

---

## Auth

### `POST /api/auth/login`

Authenticate user and set session cookie.

**Request body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200**:
```json
{ "ok": true }
```
Sets `token` httpOnly cookie (SameSite=Strict, Secure in production).

**Response 401**:
```json
{ "error": "Invalid credentials" }
```

---

### `POST /api/auth/logout`

Clear session cookie.

**Response 200**:
```json
{ "ok": true }
```

---

## Accounts

### `GET /api/accounts`

List all accounts for the authenticated user.

**Response 200**:
```json
[
  {
    "_id": "string",
    "name": "string",
    "type": "cash | stock | crypto | liability",
    "institutionUrl": "string | null",
    "currentValue": 12345.67,
    "balance": 12345.67,          // cash/liability only
    "holdings": [                  // stock/crypto only
      { "ticker": "AAPL", "quantity": 10, "pricePerUnit": 190.50 }
    ],
    "updatedAt": "2026-03-16T00:00:00Z"
  }
]
```

---

### `POST /api/accounts`

Create a new account. An initial activity snapshot is recorded at creation.

**Request body**:
```json
{
  "name": "string",
  "type": "cash | stock | crypto | liability",
  "institutionUrl": "string (optional)",
  "balance": 1000.00,              // required for cash/liability
  "holdings": [                    // required for stock/crypto
    { "ticker": "AAPL", "quantity": 10, "pricePerUnit": 190.50 }
  ]
}
```

**Response 201**: Created account document (same shape as GET list item)

**Response 400**:
```json
{ "error": "Validation message" }
```

---

### `GET /api/accounts/[id]`

Get a single account by ID.

**Response 200**: Single account document (same shape as GET list item)
**Response 404**: `{ "error": "Account not found" }`

---

### `PUT /api/accounts/[id]`

Update account balance or holdings (reconciliation). Records a new activity snapshot.

**Request body** (partial update — send only what changed):
```json
{
  "balance": 1500.00,              // for cash/liability
  "holdings": [                    // for stock/crypto (full replacement of holdings array)
    { "ticker": "AAPL", "quantity": 12, "pricePerUnit": 195.00 }
  ],
  "institutionUrl": "https://...", // optional — update link
  "name": "string"                 // optional — rename
}
```

**Response 200**: Updated account document
**Response 404**: `{ "error": "Account not found" }`

---

### `DELETE /api/accounts/[id]`

Delete an account. Activity history for this account is retained.

**Response 200**: `{ "ok": true }`
**Response 404**: `{ "error": "Account not found" }`

---

## Activity / Net Worth History

### `GET /api/activity/net-worth`

Returns net worth over time — one data point per calendar day, computed as the sum of
the latest snapshot per asset account minus the sum of the latest snapshot per liability
account, for each day that any reconciliation occurred.

**Query params**:
- `from` (optional, ISO date): start of range, default = account creation date
- `to` (optional, ISO date): end of range, default = today

**Response 200**:
```json
[
  { "date": "2025-01-01", "value": 45000.00 },
  { "date": "2025-02-15", "value": 47500.00 }
]
```

---

### `GET /api/activity/[accountId]`

Returns the activity history for a single account.

**Response 200**:
```json
[
  { "_id": "string", "value": 12345.67, "recordedAt": "2026-03-16T10:00:00Z" }
]
```

---

## Error Format

All error responses use:
```json
{ "error": "Human-readable message" }
```

HTTP status codes: `400` validation, `401` unauthorized, `404` not found, `500` server error.
