---
name: dev-workflow
description: Manage the full PRD lifecycle — write plans, branch, implement, archive, merge. Also handles dev-doc scaffolding and post-completion documentation.
license: MIT
compatibility: opencode
---

## Overview

Merged workflow combining dev-docs management and PRD lifecycle. Six commands:

| Command | Purpose |
|---------|---------|
| `devdocs init` | Scaffold the dev-docs documentation system |
| `update` | Post-completion docs update for any non-PRD change |
| `prd write` | Create a PRD plan file (planning only, no git ops) |
| `prd start` | Branch and implement a PRD |
| `prd end` | Archive PRD, update changelog, write ADR, commit |
| `prd merge` | Stack-aware branch merging in user-chosen order |

Every command starts with the **Pre-Commit Guard**. Every command appends to the **Workflow Log**.

---

## Shared Utilities

### Pre-Commit Guard

Called at the top of every mode before any other work.

1. `git status --porcelain`
2. No changes → proceed
3. Changes exist:
   a. Show changed files to the user
   b. **If current mode is `prd end`** → "Found uncommitted changes (expected from prd start). Proceeding."
      Skip guard, auto-proceed to the mode's commit step.
   c. **Otherwise** → ask: "Commit these changes first? [y/N/skip]"
      - **y** → `git add -A`, user provides commit message (or default "wip")
      - **N** → abort: "Commit or stash manually first, then re-run."
      - **skip** → proceed with warning

### Workflow Log

File: `dev-docs/workflow-log.md`

Every mode appends an entry. Append-only, newest on top within same-day groupings.

```markdown
## YYYY-MM-DD

### {command} — {milestone}-prd{NNNN}-{description}
- **Source:** user text / roadmap: "{item}"
- **Branch at time:** {branch} ({clean/dirty})
- **User decision:** {summary of what user picked}
- Command-specific fields follow
- **Pre-commit guard:** {no changes / committed wip / skipped / auto-proceeded}
```

---

## Mode: devdocs init

Initialize the dev-docs documentation system in a new or existing project.

### Steps

1. **Detect project context.** Check for well-known project config files:
   - `package.json` → Node.js/JS/TS; read `scripts.build`, `scripts.test`
   - `pyproject.toml` → Python; read `[tool.poetry]` or `[project]`
   - `Cargo.toml` → Rust
   - `go.mod` → Go
   - `Gemfile` → Ruby
   - `CMakeLists.txt` → C/C++
   - `.csproj` → C# / .NET

2. **Ask the user.** Prompt for anything you couldn't detect:
   - Project description (1 sentence)
   - Canonical build command
   - Test command
   - Output directory (if applicable, e.g. `out/`, `dist/`, `build/`)
   - Deployment target (if applicable, e.g. "Cloudflare Pages", "Vercel", "Docker")

3. **Create files.** Copy each template file from `.opencode/skills/dev-docs/templates/` to the project root, filling in detected and user-provided values. Do NOT leave `{{ placeholder }}` markers — substitute real values.
   - `templates/AGENTS.md` → `AGENTS.md`
   - `templates/.cursorrules` → `.cursorrules`
   - `templates/dev-docs/requirements.md` → `dev-docs/requirements.md`
   - `templates/dev-docs/architecture.md` → `dev-docs/architecture.md`
   - `templates/dev-docs/roadmap.md` → `dev-docs/roadmap.md`
   - `templates/dev-docs/changelog.md` → `dev-docs/changelog.md`
   - `templates/dev-docs/reminders.md` → `dev-docs/reminders.md`
   - `templates/dev-docs/archive/README.md` → `dev-docs/archive/README.md`
   - `templates/dev-docs/archive/TEMPLATE.md` → `dev-docs/archive/TEMPLATE.md`

4. **Report.** List every file created with a one-line summary of its content.

5. **Suggest commit message:** `"initialized devdocs"`

---

## Mode: update

A general update in main documentation, based on the documentation matrix. Specially useful when merging, to make sure we are providing most updated documentation with the merge

### Steps

#### 1. Pre-Commit Guard

#### 2. Classify the change

| Category | Examples |
|----------|----------|
| Feature change | Added capability, changed user-facing behavior, updated acceptance criteria |
| Architecture change | Build pipeline, data contracts, rendering, output conventions, new module |
| Operator change | Build/test commands, onboarding steps, secrets, dev workflow |
| Bug fix / small tweak | Non-feature bug fix, style, minor refactor |
| Documentation | Changelog, roadmap, comments, AGENTS.md — anything doc-only |

#### 3. Apply the update matrix

| If the change was... | Then update... |
|---|---|
| Feature behavior or capability | `requirements.md` — update or add user stories, adjust acceptance criteria |
| System design, contracts, pipeline | `architecture.md` + `changelog.md` + ADR (see step 5) |
| Onboarding, quickstart, commands | `AGENTS.md` — update Build, Test, Secrets, or Conventions sections |
| Bug fix / small tweak | `changelog.md` — add entry |
| Documentation only | No update needed (the doc IS the change). Optionally log to `changelog.md` if significant. |

A change can fall into multiple categories (e.g. an architecture change → update both `architecture.md` and `changelog.md` + ADR).

#### 4. Changelog entry format

```markdown
## YYYY-MM-DD

### {short title}
- **What:** summary of what changed
- **Reason:** why the change was made
- **Files changed:**
  - `path/to/file`: one-line description
- **Impact:** observable effects, risks, follow-ups
- **ADR:** `dev-docs/archive/{YYYY-MM-DD}-{short-title}-adr.md` (if applicable)
```

**Ordering rules:**
- Most recent on top — entries sorted newest-to-oldest by date.
- One `## YYYY-MM-DD` per day — group all entries under one date.
- Purpose/Rules section stays at the very top of the file.
- Within a single day, entries can be in any order.

#### 5. ADR (mandatory — no exceptions)

**If the change affected architecture** (schema, build pipeline, rendering contracts, data flow, agent operating process) → full ADR:

```markdown
# {YYYY-MM-DD}: {short-title}

## Context
- What problem or pressure triggered this decision?
- What constraints were relevant?

## Decision
- What was chosen?
- What is in scope and out of scope?

## Alternatives Considered
- Option A: summary, pros, cons.
- Option B: summary, pros, cons.

## Consequences
- Positive outcomes expected.
- Trade-offs accepted.
- Risks introduced and mitigation.

## Follow-ups
- Required implementation tasks.
- Required documentation updates.
```

**If no architecture change** → short-form ADR:

```markdown
# {YYYY-MM-DD}: {short-title} — no architectural changes

This change did not affect architecture. See changelog entry for scope.
```

Save ADR to `dev-docs/archive/{YYYY-MM-DD}-{short-title}-adr.md`. Link from the changelog entry.

#### 6. Do NOT commit

Documentation updates only. The user commits separately (or runs `prd end` if this turned into a PRD).

#### 7. Append to workflow log

---

## Mode: prd write

Create a PRD plan file. No git operations — no branching, no committing, no implementation.

### Steps

1. **Pre-Commit Guard**

2. **Determine milestone.**
   a. User specifies a milestone prefix (e.g. `m4`) → use it.
   b. Not specified → scan `dev-docs/archive/` for subdirectories matching `m{N}` → pick the highest number as fallback.

3. **Collect PRD content.**
   a. User provides text → build the PRD from it.
   b. No text provided → scan `dev-docs/roadmap.md` for items under `## Now` or `## Next` → ask user which item to promote to a PRD.

4. **Determine PRD number.**
   a. Scan `dev-docs/archive/{milestone}/*.md` and `dev-docs/plans/*.md` for filenames matching `{milestone}-prd{NNNN}-*.md`.
   b. Extract the highest `NNNN` → increment by 1.
   c. **No sub-PRDs.** No letter suffixes (e.g. no `prd0035b`). Every PRD gets exactly one integer.

5. **Generate filename.** `{milestone}-prd{NNNN}-{kebab-description}.md`

6. **Create the PRD file** at `dev-docs/plans/{filename}` with these sections:

   - **Overview** — one-paragraph summary of what this PRD delivers.
   - **Specification / Acceptance Criteria** — concrete, testable outcomes. What must be true when this PRD is done?
     - New UI components have corresponding stories under `src/stories/`.
     - Stories follow standards: decorators for providers, JSDoc on components,
       argTypes descriptions, use-case-focused states, mock data fixtures.
     - Existing stories pass for any modified components.
   - **Files changed (inferred)** — which files will likely be touched.
   - **Phases (optional)** — only if the PRD is too large for a single pass.
     - Each phase must state: `Testable by: [manual local dev / unit test / etc.]`
     - If a phase is not testable, question whether it should be a separate phase.
   - **Size advisory** — if the scope exceeds ~10 files or covers multiple independent features, flag it and suggest splitting into phases.

7. **Do NOT branch, do NOT commit, do NOT implement anything.**

8. **Suggest commit message:** `"prd{NNNN}: {short description}"`

9. **Append to `dev-docs/workflow-log.md`.** Include source, PRD file path, phase info.

---

## Mode: prd start

Branch and implement a PRD. Assumes the full PRD is implemented in one pass unless phases are declared.

### Steps

1. **Pre-Commit Guard**

2. **Verify PRD file exists** in `dev-docs/plans/`. If not found → abort: "No PRD to start. Run `prd write` first."

3. **Present branch options** (user picks one):
   a. **Work on existing branch** — list unmerged branches matching the PRD naming pattern. User picks one to check out.
   b. **Create from main** — suggest `{milestone}-prd{NNNN}-{kebab-description}`. Parent is `main`.
   c. **Create stacked from another unmerged branch** — list candidate branches (unmerged, same milestone, ordered by PRD number). User picks the parent.
   d. User may also specify their own branch name.

4. **If creating:** `git checkout {parent}` then `git checkout -b {branch-name}`.

5. **Implement the PRD:**
   - Full PRD in one pass (default assumption).
   - If the PRD file has a `Phases` section → implement only the active or next phase (user specifies which).
   - If the user explicitly says "phase 1 only" → implement that phase.
   - Acceptance criteria define "done" — stop when they're all met.

6. **Do NOT commit.**

7. **Suggest commit message:** `"{milestone}: prd{NNNN} - {description}"`

8. **Append to `dev-docs/workflow-log.md`.** Include branch decision, branch name, scope (full/phase).

---

## Mode: prd end

Archive the PRD, update changelog, write the mandatory ADR, and commit everything.

### Steps

1. **Pre-Commit Guard** (auto-proceeds if uncommitted changes exist — expected from `prd start`)

2. **Classify the change.** Determine the primary category:
   - Feature change | Architecture change | Operator change | Bug fix / small tweak | Planning

3. **Update changelog** (`dev-docs/changelog.md`):
   ```markdown
   ## YYYY-MM-DD

   ### {milestone} — prd{NNNN} — {short title}
   - **What:** summary of what changed
   - **Reason:** why the change was made
   - **Files changed:**
     - `path/to/file`: one-line description
   - **Impact:** observable effects, risks, follow-ups
   - **Archive:** `dev-docs/archive/{milestone}/{prd-filename}`
   - **ADR:** `dev-docs/archive/{milestone}/{adr-filename}`
   ```
   Ordering: most recent on top, grouped by date (`## YYYY-MM-DD`). Purpose/Rules section stays at the very top.

4. **Write ADR (mandatory — no exceptions).**

   **If architecture decisions changed** (schema, build pipeline, rendering contracts, data flow, agent operating process) → full ADR:

   ```markdown
   # {YYYY-MM-DD}: prd{NNNN} — {short title}

   ## Context
   - What problem or pressure triggered this decision?
   - What constraints were relevant?

   ## Decision
   - What was chosen?
   - What is in scope and out of scope?

   ## Alternatives Considered
   - Option A: summary, pros, cons.
   - Option B: summary, pros, cons.

   ## Consequences
   - Positive outcomes expected.
   - Trade-offs accepted.
   - Risks introduced and mitigation.

   ## Follow-ups
   - Required implementation tasks.
   - Required documentation updates.
   ```

   **If nothing changed from the plan** → short-form ADR with this exact title:

   ```markdown
   # {YYYY-MM-DD}: prd{NNNN} — no architectural changes

   Implementation matched the plan exactly. No deviations from the specification in `dev-docs/archive/{milestone}/{prd-filename}`.
   ```

   Save ADR to `dev-docs/archive/{milestone}/{YYYY-MM-DD}-prd{NNNN}-{description}-adr.md`. Link from the changelog entry.

5. **Verify:**
   - `npx tsc --noEmit` — type check.
   - `npm run build` — production build.
   - If PRD touched UI components: run story tests for affected stories via `storybook_run-story-tests`.
   - Fix any failures before proceeding.

6. **Archive the PRD plan:**
   a. Prepend a completion note to the plan file, between the frontmatter (if any) and the original content:
      ```
      > **Completion note ({YYYY-MM-DD}):**
      > - **What was built:** brief summary
      > - **Key decisions:** 1-2 bullet points
      > - **Deviations from plan:** anything that changed
      > - **Postponed:** items explicitly deferred
      ```
   b. `mv dev-docs/plans/{filename} dev-docs/archive/{milestone}/{filename}`

7. **Roadmap:** user manages independently — skip roadmap edits.

8. **Stage and commit:**
   ```
   git add -A
   git commit -m "{milestone}: prd{NNNN} - {description}"
   ```
   Show the diffstat to the user before committing so they can verify scope.

9. **Append to `dev-docs/workflow-log.md`.** Include change classification, ADR type (full or no-changes), commit hash.

---

## Mode: prd merge

Stack-aware branch merging. The user picks the merge order; the agent executes.

### Steps

1. **Pre-Commit Guard**

2. **`git fetch origin`** to ensure local state is current.

3. **List unmerged branches:** `git branch --no-merged main`. If none → "No branches to merge."

4. **Analyze branches:** for each unmerged branch matching `{milestone}-prd{NNNN}-*`:
   - Extract PRD number
   - Check if it exists in `dev-docs/archive/{milestone}/` (finished) or in `dev-docs/plans/` (not finished → warn: "This PRD has not been ended yet.")
   - Detect stacking relationships via `git merge-base` between candidate pairs

5. **Present merge order suggestion:**
   - Sort by PRD number ascending (respects stacking dependencies)
   - For each branch: show PRD number, description, status (finished/unfinished), and whether it contains prior branches
   - Warn about unfinished branches but do not block

6. **User picks the merge order** (multi-select or sequential confirm). User may reorder, skip branches, or abort.

7. **For each branch in the chosen order:**
   ```
   git checkout main
   git merge --no-ff {branch}
   ```
   - If merge succeeds → proceed to next branch.
   - **If conflict:** abort the entire merge, list conflicting files, hand off to the user for resolution. Do NOT try to resolve automatically.

8. **Keep all branches locally.** Do not delete them after merge.

9. **Append to `dev-docs/workflow-log.md`.** Include merge order, any conflicts, final status.

---

## Mode reference (in-skill aliases)

For agent loading, this skill is registered as `dev-workflow`. Use:
```
skill({ name: "dev-workflow" })
```

The `dev-docs` and `prd-work` skills are superseded. This single skill replaces both.
