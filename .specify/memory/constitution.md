<!--
SYNC IMPACT REPORT
==================
Version change: [template] → 1.0.0
Modified principles: none (initial ratification, all principles new)
Added sections:
  - I. Readable Code
  - II. Behavior-Driven Testing
  - III. UX Consistency & Simplicity
  - IV. Security
  - Governance
Removed sections: n/a (template placeholders replaced)
Templates updated:
  - .specify/templates/plan-template.md ✅ — Constitution Check gates align with 4 principles
  - .specify/templates/spec-template.md ✅ — User Scenarios section aligns with Principle II
  - .specify/templates/tasks-template.md ✅ — Phase structure and test guidance align with Principle II
Deferred TODOs: none
-->

# Money Talk Constitution

## Core Principles

### I. Readable Code

Code MUST be written for the next reader, not the compiler. Prefer clear naming and
simple structure over clever optimizations. Functions and components MUST do one thing.
Inline comments are reserved for non-obvious intent — self-documenting code is the norm.

### II. Behavior-Driven Testing

Tests MUST validate user behavior and integration paths, not internal implementation
details. Coverage targets are not a goal. Every test MUST correspond to a real user
scenario or system contract. Unit tests are acceptable only for pure logic with no
meaningful integration surface.

### III. UX Consistency & Simplicity

Every UI interaction MUST follow established patterns in the codebase. New patterns
require explicit justification. Prefer removing complexity over adding configuration.
Features MUST be the simplest solution that satisfies the requirement — no speculative
UX additions.

### IV. Security

User input MUST be validated and sanitized at every system boundary. Secrets MUST
never be committed or logged. Authentication and authorization MUST be verified on
every protected route. Dependencies MUST be kept up to date; known vulnerabilities
MUST be addressed before release.

## Governance

This constitution supersedes all other stated practices. Amendments require a version
bump per semantic versioning, an updated `LAST_AMENDED_DATE`, and a brief rationale in
the Sync Impact Report header comment.

All feature plans and PRs MUST pass the four principle gates before implementation begins.
Complexity violations MUST be documented in the plan's Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-03-16 | **Last Amended**: 2026-03-16
