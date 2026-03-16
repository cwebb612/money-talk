---
description: "Task list for Net Worth Snapshot MVP"
---

# Tasks: Net Worth Snapshot MVP

**Input**: Design documents from `/specs/001-net-worth-snapshot/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api-routes.md ✅ | research.md ✅

**Organization**: Tasks grouped by user story for independent implementation and delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- All file paths are relative to repo root

---

## Phase 1: Setup

**Purpose**: Install dependencies, configure environment, Docker, and project scaffolding.

- [x] T001 Add new npm packages: mongoose recharts bcryptjs jose @types/bcryptjs
- [x] T002 [P] Add Playwright and test runner: @playwright/test, add test:integration and test:unit scripts to package.json
- [x] T003 [P] Create `.env.example` at repo root with MONGO_URL, JWT_SECRET, APP_USERNAME, APP_PASSWORD (no real values)
- [x] T004 [P] Create `Dockerfile` at repo root using multi-stage build (node:20-alpine builder → runner stage, runs `npm run build` then `npm start`)
- [x] T005 [P] Create `docker-compose.yml` at repo root with `app` service (build: .) and `mongo` service (image: mongo:7, named volume `money-talk-mongo-data`), app depends_on mongo with healthcheck
- [x] T006 Create CSS design system in `app/globals.css`: define CSS variables --color-bg (#1a1a2e), --color-card (#16213e), --color-blue (#2e2d50), --color-yellow (#ffbd44), --color-text (#e0e0e0), --color-muted (#888); apply dark background to body via Tailwind

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure all user stories depend on — DB connection, auth, models, middleware.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T007 Create `lib/db/mongodb.ts` — Mongoose connection singleton using cached module-level promise (standard Next.js pattern to survive hot-reload)
- [x] T008 [P] Create `lib/db/models/user.ts` — Mongoose User schema: username (string, unique, required), passwordHash (string, required), createdAt (Date, auto)
- [x] T009 [P] Create `lib/db/models/account.ts` — Mongoose Account schema per data-model.md: userId (ObjectId ref users), name, type enum (cash/stock/crypto/liability), institutionUrl (optional), balance (Number, optional), holdings (array of {ticker, quantity, pricePerUnit}), currentValue (Number), timestamps
- [x] T010 [P] Create `lib/db/models/activity.ts` — Mongoose Activity schema: accountId (ObjectId ref accounts), userId (ObjectId ref users), value (Number), recordedAt (Date, default now); add compound index on userId + recordedAt
- [x] T011 Create `lib/auth/password.ts` — export `hashPassword(plain: string)` and `comparePassword(plain, hash)` using bcryptjs (saltRounds: 10)
- [x] T012 Create `lib/auth/session.ts` — export `signToken(payload)` and `verifyToken(token)` using jose with JWT_SECRET env var; export `setSessionCookie(res, token)` and `clearSessionCookie(res)`; token expiry 30 days
- [x] T013 Create `lib/utils/money.ts` — export `calculateAccountValue(account)` for cash/liability (returns balance) and stock/crypto (returns sum of quantity × pricePerUnit per holding); export `formatUSD(value: number)` returning formatted string
- [x] T014 Create `middleware.ts` at repo root — protect all routes under `/(app)` (i.e. `/` and `/accounts/**`); verify JWT from cookie using `verifyToken`; redirect to `/login` if missing or invalid
- [x] T015 Create `app/api/auth/login/route.ts` — POST handler: validate body, call `comparePassword`, sign JWT, set cookie, return `{ ok: true }`; 401 on bad credentials
- [x] T016 Create `app/api/auth/logout/route.ts` — POST handler: clear session cookie, return `{ ok: true }`
- [x] T017 Create `app/(auth)/login/page.tsx` — login form (username + password), calls POST /api/auth/login, redirects to `/` on success; use --color-blue card, --color-yellow submit button
- [x] T018 Create `app/layout.tsx` (root layout) — applies globals.css, sets dark background, minimal wrapper
- [x] T019 Create seed logic in `lib/db/seed.ts` — on app startup (called from mongodb.ts after connect), check if user exists; if not, create user from APP_USERNAME + APP_PASSWORD env vars using `hashPassword`

**Checkpoint**: Auth works end-to-end. Login page → cookie set → redirect. Logout clears cookie. Middleware blocks unauthenticated requests.

---

## Phase 3: User Story 1 — View Net Worth Dashboard (Priority: P1) 🎯 MVP

**Goal**: Authenticated user sees net worth total, time-series graph, and account breakdown on the dashboard.

**Independent Test**: Seed DB with 2 asset accounts + 1 liability + 3 activity entries. Load `/`. Verify net worth total = assets − liabilities. Verify graph has 3 data points. Verify accounts appear in correct group.

### Implementation for User Story 1

- [x] T020 Create `app/api/activity/net-worth/route.ts` [US1] — GET handler: query activity collection for userId, group by calendar day (latest value per account per day), compute daily net worth (assets − liabilities), return sorted array of `{ date, value }`; support optional `from`/`to` query params
- [x] T021 [P] [US1] Create `components/ui/Card.tsx` — reusable card wrapper using --color-card background, rounded corners, padding; accepts className prop
- [x] T022 [P] [US1] Create `components/ui/Button.tsx` — reusable button with variant prop (primary: --color-yellow text-black, ghost: transparent); forwards ref
- [x] T023 [P] [US1] Create `components/ui/Input.tsx` — reusable input using --color-card background, --color-text text, border on focus
- [x] T024 [US1] Create `components/dashboard/NetWorthHeader.tsx` — displays current net worth as large formatted number (--color-yellow) and last-updated date; accepts `value: number` and `updatedAt: string`
- [x] T025 [US1] Create `components/dashboard/NetWorthChart.tsx` — Recharts LineChart with `data: { date: string, value: number }[]`; dark background (#1a1a2e), yellow (#ffbd44) line, no grid lines, responsive container; x-axis shows abbreviated dates; tooltip shows formatted USD
- [x] T026 [US1] Create `components/dashboard/AccountBreakdown.tsx` — renders two sections (Assets, Liabilities) each listing AccountCard components; accepts `accounts: Account[]`; computes section totals
- [x] T027 [US1] Create `components/accounts/AccountCard.tsx` — displays account name, type badge, current value; clicking navigates to `/accounts/[id]`; uses Card component
- [x] T028 [US1] Create `app/(app)/page.tsx` (dashboard) — server component: fetch accounts and net worth history from API routes (or direct DB calls); render NetWorthHeader + NetWorthChart + AccountBreakdown; show "Add your first account" CTA when accounts list is empty

**Checkpoint**: Dashboard fully functional and independently testable. Net worth graph renders. Account breakdown shows correct groups and totals.

---

## Phase 4: User Story 2 — Create and Manage Accounts (Priority: P2)

**Goal**: User can create accounts of all four types (cash, stock, crypto, liability) with an institution link and display name.

**Independent Test**: Create one account of each type via the UI. Verify each appears on the dashboard with correct calculated value. Verify institution link field is saved.

### Implementation for User Story 2

- [x] T029 Create `app/api/accounts/route.ts` [US2] — GET handler: return all accounts for userId sorted by type; POST handler: validate body (type-specific fields), call `calculateAccountValue`, save account, record initial activity snapshot, return 201 with created account
- [x] T030 [P] [US2] Create `components/accounts/HoldingsEditor.tsx` — add/remove holdings rows; each row: ticker (text input), quantity (number input), pricePerUnit (number input); shows calculated row value; used in AccountForm for stock/crypto
- [x] T031 [US2] Create `components/accounts/AccountForm.tsx` — shared create/edit form; type selector (cash/stock/crypto/liability) controls which fields appear (balance input or HoldingsEditor); name input; institutionUrl input; submit calls provided `onSubmit` handler; uses ui/Input and ui/Button
- [x] T032 [US2] Create `app/(app)/accounts/new/page.tsx` — wraps AccountForm; on submit POSTs to /api/accounts; on success redirects to `/`
- [x] T033 [US2] Create `app/api/accounts/[id]/route.ts` — GET handler: return single account by id (verify userId ownership); PUT handler: validate partial update body, recalculate currentValue, update account, record activity snapshot, return updated account; DELETE handler: delete account, return `{ ok: true }`

**Checkpoint**: All four account types can be created and appear on the dashboard. Values calculate correctly.

---

## Phase 5: User Story 3 — Reconcile Accounts (Priority: P3)

**Goal**: User can open an account detail page, click the institution link, update the balance or holdings, and see the net worth graph update.

**Independent Test**: Create a cash account. Navigate to its detail page. Verify institution link is clickable. Update the balance. Verify a new activity snapshot is recorded. Return to dashboard and verify graph shows a new data point.

### Implementation for User Story 3

- [x] T034 [P] [US3] Create `components/ui/ExternalLink.tsx` — anchor tag with `target="_blank" rel="noopener noreferrer"`; displays link text + external icon; styled with --color-yellow on hover
- [x] T035 [US3] Create `components/accounts/AccountDetail.tsx` — displays account name, type, current value, institution link (ExternalLink), and edit form (AccountForm in edit mode); accepts account data and onUpdate handler
- [x] T036 [US3] Create `app/(app)/accounts/[id]/page.tsx` — server component: fetch account by id; render AccountDetail; on form submit PUTs to /api/accounts/[id]; on success re-fetches and re-renders; add "Back to Dashboard" nav link
- [x] T037 [US3] Create `app/api/activity/[accountId]/route.ts` — GET handler: return activity history for accountId (verify userId ownership), sorted by recordedAt ascending

**Checkpoint**: Full reconciliation flow works. Institution link opens in new tab. Saving updates the graph on the dashboard.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, error states, empty states, and integration test setup.

- [x] T038 [P] Create `app/(app)/layout.tsx` — auth-gated app shell: top nav with "Money Talk" brand (--color-yellow), "Add Account" link, logout button (calls POST /api/auth/logout then redirects to /login); wraps children
- [x] T039 [P] Add error boundary / not-found handling: create `app/not-found.tsx` and `app/error.tsx` with minimal dark-themed pages
- [x] T040 [P] Create `tests/integration/auth.test.ts` — Playwright: navigate to `/`, expect redirect to `/login`; login with valid creds, expect redirect to `/`; logout, expect redirect to `/login`
- [x] T041 [P] Create `tests/integration/accounts.test.ts` — Playwright: create a cash account, verify it appears on dashboard with correct value; create a stock account with holdings, verify calculated value
- [x] T042 [P] Create `tests/integration/reconciliation.test.ts` — Playwright: navigate to account detail, update balance, verify dashboard net worth changes and graph shows new point
- [x] T043 [P] Create `tests/unit/money.test.ts` — Jest: test `calculateAccountValue` for all four account types including edge cases (0 quantity, 0 price, multiple holdings)
- [x] T044 Run quickstart.md validation checklist: docker compose up, verify all 7 checklist items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Dashboard (Phase 3)**: Depends on Foundational
- **US2 Account Management (Phase 4)**: Depends on Foundational; US1 not required but dashboard integration is better with it
- **US3 Reconciliation (Phase 5)**: Depends on US2 (account detail requires accounts to exist)
- **Polish (Phase 6)**: Depends on all user story phases

### Within Each Phase

- Models before services
- Services / API routes before pages
- Shared UI components ([P]) can be built in parallel with models
- AccountForm (T031) depends on HoldingsEditor (T030)
- Dashboard page (T028) depends on all dashboard components (T024–T027)

### Parallel Opportunities

```bash
# Phase 1 — all parallel after T001:
T002, T003, T004, T005, T006

# Phase 2 — models in parallel after T007:
T008, T009, T010 (models, no interdependency)
T011, T012, T013 (utils/auth, no interdependency)

# Phase 3 — UI components in parallel:
T021, T022, T023 (ui primitives)
T024, T025, T026, T027 (dashboard components, each independent file)

# Phase 4 — form + holdings in parallel, then route + page:
T030 (HoldingsEditor) in parallel with T029 (API route)

# Phase 6 — all polish tasks in parallel:
T038, T039, T040, T041, T042, T043
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: Dashboard (P1)
4. **STOP and VALIDATE**: Log in → see net worth graph + account breakdown
5. Demo / validate before continuing

### Incremental Delivery

1. Setup + Foundational → auth works, DB connected
2. Add US1 → Dashboard renders (seeded data) → demo
3. Add US2 → Can create all account types → dashboard populates from real data
4. Add US3 → Reconciliation flow live → graph starts growing
5. Polish → nav, tests, Docker validation

### Parallel Team Strategy (if applicable)

Once Foundational is done:
- Dev A: US1 dashboard components + API
- Dev B: US2 account CRUD API + form
- US3 starts after US2 lands
