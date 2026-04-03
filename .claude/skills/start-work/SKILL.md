---
name: start-work
description: Set up the workspace to get shit done
---

Git setup for starting a new feature branch.

## Trigger

Invoke with `/init` or when the user says they are starting work on something (e.g. "I'm starting work on X", "Init my workspace for Y", "Prepare my workspace for Z", "Lets get starting working on A").

## Steps

1. **Check current branch** — run `git branch --show-current` and `git status` in parallel.
2. **Stash or warn** — if there are uncommitted changes on the current branch, warn the user and ask whether to stash, commit, or abort before continuing.
3. **Switch to main** — if not already on `main`, run `git checkout main`.
4. **Pull latest** — run `git pull` to ensure main is up to date.
5. **Create feature branch** — derive a branch name from the user's description:
   - Use the prefix `feat-` for new features, `fix-` for bug fixes, `chore-` for maintenance.
   - Keep it very short: 2–4 lowercase words joined with hyphens (e.g. `feat-per-account-timer`, `fix-login-redirect`).
   - Never include ticket numbers, dates, or usernames.
   - Run `git checkout -b <branch-name>`.
6. **Confirm** — tell the user the branch name and that they're ready to start. One sentence, no fluff.
