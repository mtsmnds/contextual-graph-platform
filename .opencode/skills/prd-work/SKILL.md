---
name: prd-work
description: Branch workflow for PRD-driven development — start, finish, and merge branches aligned to design documents
license: MIT
compatibility: opencode
---

## Overview

Manages the lifecycle of a PRD from branch creation through completion and merge. Each PRD that involves code changes gets its own branch. Pure docs/research stays on `main`.

Branches are **stacked**: each new PRD branches from the previous PRD's branch (not from `main`). This keeps diffs clean and dependencies clear. Merging happens in order — merge the lowest-numbered PRD first, then each subsequent PRD merges into `main` (or the prior merged branch).

## Commands

- `/prd-work --start <prd-number>` — Create stacked branch, begin implementation
- `/prd-work --finish`             — Archive PRD, update docs, commit code + docs
- `/prd-work --merge`              — Merge current branch into main (or into previous branch)

## Branch naming

```
{milestone}-{prd-number}-{kebab-description}
```

Examples: `m4-prd0024-isolate-product`, `m4-prd0025-schema-sortorder`

## Stacking rule

Each new PRD branch is created from the **previous** unmerged PRD branch, not from `main`:

```
main → m4-prd0024-xxx → m4-prd0025-xxx → m4-prd0026-xxx → ...
```

A branch IS the cumulative diff of all prior PRDs in the stack. When merging, merge PRD0024 → main, then PRD0025 → main (or PRD0025 → main if PRD0024 was already merged).

## PRD file naming

`dev-docs/plans/{milestone}-{prd-number}-{description}.md`

## Lifecycle

```
start → work (iterative, commit as you go) → finish (archive + docs cleanup commit) → merge
```

- **start**: determine parent branch (prior PRD or main), branch off it, begin implementation
- **work**: commit code and docs changes incrementally during implementation
- **finish**: update changelog/roadmap, archive PRD file, add a final cleanup commit
- **merge**: integrate into main

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
   - Example: `m4-prd0025-schema-sortorder`

3. **Determine the parent branch** (stacking):
   - List existing branches: `git branch --list | sort`
   - Find the branch with the highest PRD number that's lower than the current PRD number, same milestone, and not yet merged into `main`.
   - If it exists, use it as the parent. If not, use `main`.
   - Example: starting PRD0025, if `m4-prd0024-isolate-product` exists, branch from it (not main).

4. **Create the branch** from the parent:
   ```
   git checkout {parent-branch}
   git checkout -b {branch-name}
   ```

5. **Work on the PRD.** The branch is now active. Proceed to implement the PRD — read the plan, write code, create files, etc. Commit as you go during implementation. Do not wait until finish to commit code changes.

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

Stage all changed files — both `dev-docs/` and code — then commit.

```
git add -A
git commit -m "{milestone}: {prd-number} - {short description}"

# example:
# m4: prd0025 - schema sortOrder queryThread
```

If you committed code incrementally during the work phase, the diff may be small (just the docs changes). If you didn't commit during work, this commit captures everything.

#### 3. Report

Summarize what was archived, what roadmap items were moved, and the commit message used.

---

## Mode: merge

Use to integrate a finished PRD branch into `main`. In a stacked workflow, merge the lowest-numbered (most base) branch first, then merge subsequent branches.

### Steps

1. **Verify the branch is finished.** Confirm the PRD file has been archived (no longer in `plans/`). If not, run Mode: finish first.

2. **Determine merge target.** If this is the first PRD in the stack to be merged, target is `main`. If a lower-numbered PRD was already merged, this branch's changes are already on `main` — just verify and clean up.

3. **Merge into main:**
   ```
   git checkout main
   git pull origin main
   git merge {branch-name} --no-ff
   ```

4. **Post-merge (branch stays).** The branch is kept locally for reference — do not delete it.

5. **Report.** Confirm the merge completed, the branch still exists locally, and note any stacking dependencies.
