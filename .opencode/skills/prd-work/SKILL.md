---
name: prd-work
description: Branch workflow for PRD-driven development — start, finish, and merge branches aligned to design documents
license: MIT
compatibility: opencode
---

## Overview

Manages the lifecycle of a PRD from branch creation through completion and merge. Each PRD that involves code changes gets its own branch. Pure docs/research stays on `main`.

## Commands

- `/prd-work --start <prd-number>` — Create branch from main, begin implementation
- `/prd-work --finish`             — Update docs (via dev-docs skill), archive PRD, commit
- `/prd-work --merge`              — Merge current branch into main


## Branch naming

```
{milestone}-{prd-number}-{kebab-description}
```

Examples: `m4-prd0024-isolate-product`, `m3-prd0021-passage-anchor-marks`

Branches are created from `main` and merged back into `main`.

## PRD file naming

`dev-docs/plans/{milestone}-{prd-number}-{description}.md`

## Lifecycle

```
start → work (iterative) → finish → merge
```

- **start**: create branch from main, then work on the PRD
- **finish**: archive PRD, update changelog + roadmap, commit docs
- **merge**: integrate branch into main

## How to use

The user says which mode they want ("start", "finish", "merge") and the agent follows the corresponding section below. No special command syntax needed — the section headings are the mode declarations.

---

## Mode: start

Use when beginning work on a new PRD. Creates the branch then proceeds to implement the PRD.

### Steps

1. **Locate the PRD.** Check the PRD file exists in `dev-docs/plans/`. If the user didn't specify one, ask which PRD.
   - Convention: `{milestone}-{prd-number}-{description}.md`

2. **Derive the branch name** from the filename:
   - Strip `.md` extension → `{milestone}-{prd-number}-{description}`
   - Example: `m4-prd0024-isolate-product`

3. **Create the branch** from `main`:
   ```
   git checkout main
   git pull origin main
   git checkout -b {branch-name}
   ```

4. **Work on the PRD.** The branch is now active. Proceed to implement the PRD — read the plan, write code, create files, etc. Do not stop after creating the branch.

---

## Mode: finish

Use when a PRD is complete and ready to be archived.

### Prerequisites

The PRD file must exist in `dev-docs/plans/`.

### Steps

#### 1. Load the dev-docs skill

Call `skill({ name: "dev-docs" })` and run Mode: archive-plan. This handles the entire archival workflow — prepending an ADR-style completion note, promoting the PRD to `archive/`, updating the roadmap, and adding a changelog entry.

Do not deviate from the archive-plan workflow. Do not substitute Mode: update.

#### 2. Stage and commit

```
git add dev-docs/
git commit -m "{milestone}: {prd-number} - {short description}"

# example:
# m4: prd0024 - isolate current product
```

#### 3. Report

Summarize what was archived, what roadmap items were moved, and the commit message used.

---

## Mode: merge

Use to integrate a finished PRD branch into `main`.

### Steps

1. **Verify the branch is finished.** Confirm the PRD file has been archived (no longer in `plans/`). If not, run Mode: finish first.

2. **Merge into main:**
   ```
   git checkout main
   git pull origin main
   git merge {branch-name}
   git push origin main
   ```

3. **Post-merge (branch stays).** The branch is kept locally for reference — do not delete it.

4. **Report.** Confirm the merge completed and the branch still exists locally.
