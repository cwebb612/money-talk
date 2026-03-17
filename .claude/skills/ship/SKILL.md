---
name: ship
description: Run checks, optionally commit, push, and open a PR with a bump label
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status`
- Staged and unstaged diff: !`git diff HEAD`
- Recent commits: !`git log --oneline -10`

## Your task

1. **Run checks** — execute these three commands and collect their output:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run test:unit`
   If any check fails, stop immediately and report the failure output to the user. Do not proceed.

2. **Branch** — if the current branch is `main`, create and check out a new branch with a short kebab-case name derived from the changes (e.g. `feat/investment-account-type`).

3. **Commit** — only if there are uncommitted changes (staged or unstaged tracked files):
   - Stage all modified files with `git add .`
   - Create a single commit with a concise message summarising what changed.
   - If the working tree is already clean, skip this step silently.

4. **Push** — push the branch to origin.

5. **Open PR** — run `gh pr create` with:
   - A short title (under 70 chars)
   - A body covering what is in @.github/pull_request_template.md
   - A bump label applied via `--label`: assess the changes and pick one:
     - `bump:patch` — bug fixes, tweaks, dependency updates, config changes
     - `bump:minor` — new features, non-breaking additions
     - `bump:major` — breaking changes

Do all of the above sequentially. After each step report a one-line status to the user, then return the final PR URL when done.
