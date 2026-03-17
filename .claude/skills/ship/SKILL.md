---
name: ship
description: Run lint + tests, then commit and open a PR (branches off main automatically)
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
   If any check fails, stop immediately and report the failure output to the user. Do not proceed to commit or PR.

2. **Branch** — if the current branch is `main`, create and check out a new branch with a short kebab-case name derived from the changes (e.g. `feat/investment-account-type`).

3. **Commit** — stage all modified tracked files (`git add -u`) and create a single commit with a concise message that summarises what changed. End the commit message with:
   `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

4. **Push** — push the branch to origin with `-u`.

5. **Open PR** — run `gh pr create` with:
   - A short title (under 70 chars)
   - A body built from the actual diff and commit history that covers:
     - What changed and why
     - Any notable decisions or trade-offs
     - A short test plan checklist
   - End the body with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

Do all of the above sequentially. After each step report a one-line status to the user, then return the final PR URL when done.
