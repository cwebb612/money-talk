# Research: Net Worth Snapshot MVP

**Branch**: `001-net-worth-snapshot` | **Date**: 2026-03-16

## Chart Library

**Decision**: Recharts
**Rationale**: Declarative React API, TypeScript-native, composable components, active
maintenance, no canvas dependency (SVG-based — easier to style). Lightweight relative
to Chart.js which requires a canvas wrapper in Next.js.
**Alternatives considered**:
- Chart.js + react-chartjs-2: more features but heavier, requires canvas, imperative API
- Victory: good TS support but heavier bundle
- Tremor: pre-styled but opinionated and less flexible for custom dark theme

## MongoDB Integration

**Decision**: Mongoose ODM
**Rationale**: TypeScript schema definitions, built-in validation, clean query API,
connection pooling built in. Slightly heavier than the native driver but the schema
safety is worth it for a data-model-heavy app.
**Alternatives considered**:
- Native `mongodb` driver: lighter but no schema validation, more boilerplate for TS types
- Prisma with MongoDB: overkill for single-user app, experimental MongoDB support

**Connection pattern**: Single shared Mongoose connection via a module-level cached
promise — the standard Next.js pattern to avoid creating new connections per API route
in development hot-reload.

## Authentication

**Decision**: Custom username/password auth with `bcryptjs` + `jose` JWT in httpOnly cookie
**Rationale**: User explicitly requested "super simple" auth. NextAuth.js adds provider
abstraction and session tables that are unnecessary for a single-user personal tool.
Custom implementation is ~50 lines and fully transparent.
**Alternatives considered**:
- NextAuth.js credentials provider: more config than needed, adds session overhead
- Iron-session: good option but one more dep; `jose` already covers JWT needs
- Plain cookie with server-side session: no JWT needed for single user, but JWT is
  stateless and simpler to validate in middleware

**Token storage**: httpOnly, SameSite=Strict cookie. Prevents XSS theft of the token.
**Password hashing**: bcryptjs (no native bindings — works in any Docker base image
without compilation issues).

## Docker Strategy

**Decision**: Multi-stage Dockerfile (build stage → production stage)
**Rationale**: Final image excludes dev dependencies, reducing image size significantly.
Standard for Next.js production deployments.

**docker-compose.yml** includes:
- `app` service (Next.js) with env vars
- `mongo` service using official `mongo:7` image with named volume for data persistence
- Health check on mongo before app starts

**Alternatives considered**:
- Single-stage build: simpler but produces a ~2-3x larger image with all devDeps

## Styling Approach

**Decision**: Tailwind CSS v4 with CSS variables for the design system
**Rationale**: Already in the project. CSS variable theming (`--color-blue`, `--color-yellow`)
makes the palette swappable without touching component code (constitution: templatability).
**Color system**:
- Background primary: `#1a1a2e` (near-black with blue tint)
- Background card: `#16213e`
- Brand blue: `#2e2d50`
- Accent yellow: `#ffbd44`
- Text primary: `#e0e0e0`
- Text muted: `#888`

## Testing Approach

**Decision**: Playwright for integration/behavior tests, Jest for pure calculation logic
**Rationale**: Constitution principle II mandates behavior-driven tests, not coverage.
Playwright tests user flows end-to-end (login → create account → reconcile → see graph).
Jest is used only for `lib/utils/money.ts` calculation functions which are pure and
have no meaningful integration surface.
**Alternatives considered**:
- Cypress: similar capability, slightly heavier
- Vitest: fast unit tests but overkill for pure functions here

## Activity Log Architecture

**Decision**: `activity` collection with one document per reconciliation save, storing
`accountId`, `userId`, `value` (total at that moment), and `recordedAt` timestamp.
**Rationale**: Append-only log is simple, queryable by account and date range, and
naturally produces the time-series data for the chart. No update or delete of activity
documents — pure audit trail.
**Graph aggregation**: For the net worth graph, query all activity grouped by date,
take the latest snapshot per account per day, then sum across accounts. This is done
server-side in the API route.
