# Feature Specification: Net Worth Snapshot MVP

**Feature Branch**: `001-net-worth-snapshot`
**Created**: 2026-03-16
**Status**: Draft
**Input**: User description: Personal finance platform focused on a net worth snapshot — not budgeting.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Net Worth Dashboard (Priority: P1)

A user logs into the app and immediately sees their complete financial picture: a net worth
trend graph showing how their wealth has grown over time, and a breakdown of all their
accounts grouped by type (assets vs. liabilities).

**Why this priority**: This is the core value proposition. Without a dashboard showing net
worth history, the app has no differentiated purpose.

**Independent Test**: Can be tested by seeding a user with accounts and historical snapshots,
then verifying the dashboard renders the correct total, graph, and account breakdown.

**Acceptance Scenarios**:

1. **Given** a user has accounts with recorded values, **When** they open the dashboard,
   **Then** they see a line graph of their total net worth over time, with the most recent
   value prominently displayed.
2. **Given** the user has both asset and liability accounts, **When** viewing the dashboard,
   **Then** they see a breakdown listing each account with its current value, grouped under
   Assets and Liabilities.
3. **Given** the user has no accounts yet, **When** they open the dashboard, **Then** they
   see a prompt to add their first account.

---

### User Story 2 - Create and Manage Accounts (Priority: P2)

A user adds their financial accounts to the platform — bank accounts, investment accounts,
crypto wallets, and debts — so the system can track their net worth.

**Why this priority**: Without accounts, there is nothing to display or reconcile. This
is the prerequisite for all other value.

**Independent Test**: Can be tested by creating one of each account type, verifying the
correct fields are available, and confirming the account appears in the dashboard breakdown.

**Acceptance Scenarios**:

1. **Given** a user wants to add a bank account, **When** they create a Cash account and
   enter the current balance, **Then** the account appears in Assets with that balance.
2. **Given** a user wants to track a stock position, **When** they create a Stock account
   and enter a ticker, quantity of shares, and current price per share, **Then** the account
   shows the calculated total value (quantity × price).
3. **Given** a user wants to track crypto, **When** they create a Crypto account and enter
   a ticker, quantity, and current price per unit, **Then** the account shows the calculated
   total value.
4. **Given** a user wants to track a debt (e.g., mortgage, credit card), **When** they
   create a Liability account and enter the outstanding balance, **Then** the account appears
   under Liabilities and reduces net worth by that amount.
5. **Given** any account type, **When** creating the account, **Then** the user can add a
   link URL pointing to the institution's website (e.g., fidelity.com), and a display name
   for the account.

---

### User Story 3 - Reconcile Accounts (Priority: P3)

The core recurring workflow: a user logs in, goes account by account, clicks the link to
open the institution's site in a new tab, checks their current balance/holdings, then
updates the account in the app. Each update is recorded as a snapshot, building the
historical trend.

**Why this priority**: Reconciliation is the repeated action that generates historical data
making the net worth graph meaningful. Without it the graph never grows.

**Independent Test**: Can be tested by updating an account's value multiple times and
verifying each update creates a new dated snapshot, with the dashboard graph reflecting
the change.

**Acceptance Scenarios**:

1. **Given** a user clicks into an account, **When** the account detail page loads, **Then**
   they see the institution link as a clickable button that opens in a new tab, the current
   recorded value, and an edit form.
2. **Given** a Cash account, **When** the user enters a new balance and saves, **Then**
   a snapshot is recorded with the new value and today's date, and the dashboard updates.
3. **Given** a Stock or Crypto account, **When** the user updates the quantity or price per
   unit and saves, **Then** the new total is calculated, a snapshot is recorded, and the
   dashboard reflects the change.
4. **Given** multiple reconciliation events over time, **When** the user views the dashboard
   graph, **Then** each update appears as a data point on the trend line, showing growth or
   decline over the period.

---

### Edge Cases

- What if a user has no reconciliation history? The graph shows a single point (the account
  creation date with initial values entered at creation).
- What if quantity is set to 0 on a stock/crypto account? The account value becomes $0 but
  the account remains active and is not auto-deleted.
- What if a user adds the same ticker in two different accounts? Each account is independent;
  totals are summed on the dashboard without deduplication.
- What happens if the user saves the same value twice in a row? A snapshot is still recorded;
  the graph will show a flat line for that period which is accurate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to authenticate (sign in / sign out) to access the platform.
- **FR-002**: The dashboard MUST display the user's current total net worth (assets minus
  liabilities) as the primary heading value.
- **FR-003**: The dashboard MUST display a time-series graph of net worth, with one data
  point per reconciliation save event.
- **FR-004**: The dashboard MUST display a breakdown of all accounts grouped into Assets and
  Liabilities sections, each account showing its current value.
- **FR-005**: Users MUST be able to create accounts of four types: Cash, Stock, Crypto, and
  Liability.
- **FR-006**: Cash and Liability accounts MUST accept a single USD balance field.
- **FR-007**: Stock and Crypto accounts MUST accept a ticker symbol, a quantity of units
  held, and a price per unit in USD; the system MUST calculate total value as quantity × price.
- **FR-008**: All account types MUST accept a display name and an optional institution link
  (URL).
- **FR-009**: Users MUST be able to navigate to an account detail view from the dashboard.
- **FR-010**: The account detail view MUST display the institution link as a clickable
  element that opens the URL in a new browser tab.
- **FR-011**: Users MUST be able to update any account's value or holdings from the account
  detail view.
- **FR-012**: Every time an account's value is saved, the system MUST record a snapshot with
  the new total value and the current date.
- **FR-013**: The net worth graph on the dashboard MUST update to reflect new snapshots
  immediately after reconciliation.
- **FR-014**: All monetary values MUST be denominated and displayed in USD.

### Key Entities

- **User**: Authenticated identity that owns all accounts and snapshots.
- **Account**: Named financial account with a type (Cash | Stock | Crypto | Liability),
  optional institution URL, and a current calculated value.
- **Holding** *(Stock and Crypto accounts only)*: Ticker symbol, quantity of units held,
  and price per unit in USD. Account value is derived from these fields.
- **AccountSnapshot**: A dated record of an account's total value at a point in time,
  created on each reconciliation save. Provides the data for the net worth history graph.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a full reconciliation pass (log in, update all accounts,
  review updated dashboard) in under 5 minutes for up to 10 accounts.
- **SC-002**: The net worth graph correctly reflects all recorded snapshots with no missing
  or out-of-order data points.
- **SC-003**: The net worth total on the dashboard equals the sum of all asset account values
  minus all liability account values at all times.
- **SC-004**: 100% of account saves result in a new snapshot being recorded — no silent
  failures.
- **SC-005**: A user can navigate from the dashboard to an account detail view and back in
  2 interactions or fewer.

## Assumptions

- **Single user per installation**: The MVP is a personal tool; no multi-user sharing,
  roles, or permissions model is required.
- **Manual price entry**: Stock and crypto prices are entered manually by the user — no
  live market data feeds are in scope for the MVP.
- **Snapshots on save only**: Historical data points are created only when the user
  explicitly saves an update — no automatic scheduled snapshots.
- **USD only**: All values are in US dollars; no currency conversion is required.
- **"Sure" app aesthetic reference**: Clean, minimal card-based UI with a prominent net
  worth number and muted color palette; exact visual design is at implementer discretion
  within these guidelines.
