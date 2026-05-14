---
name: dev-docs
description: Initialize and maintain structured project docs — scaffold the dev-docs system in new projects, then after every completed change update the right files (requirements, architecture, roadmap, changelog, ADRs)
license: MIT
compatibility: opencode
---

## Overview

This skill manages a structured documentation suite: `dev-docs/` folder at project root with requirements, architecture, roadmap, changelog, ADR archive, and plans. Plus `AGENTS.md` as the operative guide for agents/contributors.

### File purposes

| File | Purpose |
|------|---------|
| `AGENTS.md` | Project overview, build/test commands, conventions — operative guide |
| `dev-docs/requirements.md` | Feature intent, user stories, acceptance criteria |
| `dev-docs/architecture.md` | System design, contracts, build flow |
| `dev-docs/roadmap.md` | Active priorities (Now/Next/Later) |
| `dev-docs/changelog.md` | Completed significant changes with rationale |
| `dev-docs/archive/` | ADR files + **completed PRDs** (plans promoted here after execution) |
| `dev-docs/plans/` | **Future/present plans only** — vision docs, design blueprints for work not yet started or in progress. Once a plan is executed, it moves to `archive/`. |

Available templates for Mode: init live in the `templates/` directory sibling to this file.

---

## Mode: init (scaffold)

Use when the user asks to initialize or set up the documentation system in a new or existing project.

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

3. **Create files.** Copy each template file from `templates/` to the project root, filling in detected and user-provided values. Do NOT leave `{{ placeholder }}` markers — substitute real values.
   - `.opencode/skills/dev-docs/templates/AGENTS.md` → `AGENTS.md`
   - `.opencode/skills/dev-docs/templates/.cursorrules` → `.cursorrules`
   - `.opencode/skills/dev-docs/templates/dev-docs/requirements.md` → `dev-docs/requirements.md`
   - `.opencode/skills/dev-docs/templates/dev-docs/architecture.md` → `dev-docs/architecture.md`
   - `.opencode/skills/dev-docs/templates/dev-docs/roadmap.md` → `dev-docs/roadmap.md`
   - `.opencode/skills/dev-docs/templates/dev-docs/changelog.md` → `dev-docs/changelog.md`
   - `.opencode/skills/dev-docs/templates/dev-docs/reminders.md` → `dev-docs/reminders.md`
   - `.opencode/skills/dev-docs/templates/dev-docs/archive/README.md` → `dev-docs/archive/README.md`
   - `.opencode/skills/dev-docs/templates/dev-docs/archive/TEMPLATE.md` → `dev-docs/archive/TEMPLATE.md`

4. **Report.** List every file created and a one-line summary of its content.

---

## Mode: update (post-completion)

Use after every completed task — feature, refactor, bugfix, planning, docs change.

### Steps

#### 1. Classify the change

Determine which category the completed work falls into:

| Category | Examples |
|----------|----------|
| Feature change | Added capability, changed user-facing behavior, updated acceptance criteria |
| Architecture change | Build pipeline, data contracts, rendering, output conventions, new module |
| Operator change | Build/test commands, onboarding steps, secrets, dev workflow |
| Priority change | Reprioritized roadmap, moved items between Now/Next/Later |
| Planning | Created a design doc or plan for future work |
| Bug fix / small tweak | Non-feature bug fix, style, minor refactor |

#### 2. Apply the update matrix

| If the change was... | Then update... |
|---|---|
| Feature behavior or capability | `requirements.md` — update or add user stories, adjust acceptance criteria |
| System design, contracts, pipeline | `architecture.md` + `changelog.md` + create ADR in `archive/` |
| Onboarding, quickstart, commands | `AGENTS.md` — update Build, Test, Secrets, or Conventions sections |
| Priority, sequencing, future intent | `roadmap.md` — move items, update milestone status |
| Significant completed change | `changelog.md` — add entry with what/why/impact/files |
| Quick reference / operational note | `reminders.md` — add informal note |

A change can fall into multiple categories (e.g. an architecture change is also significant → update both `architecture.md` and `changelog.md` + ADR).

#### 3. Changelog entry format

When adding to `changelog.md`:

```markdown
## YYYY-MM-DD

### Short title
- **What:** summary of what changed
- **Reason:** why the change was made
- **Files changed:**
  - `path/to/file`: one-line description of the change
- **Impact:** observable effects, risks, follow-ups
- **ADR:** `archive/YYYY-MM-DD-short-title.md` (if applicable)
```

#### 4. ADR — when to create one

An ADR (Architecture Decision Record) is required when the change affects:
- Build pipeline stages or orchestration
- Content/data schema or contracts
- Rendering or output contracts
- Output folder or artifact conventions
- Contributor/agent operating process

When in doubt, create the ADR.

ADR format (copy from `archive/TEMPLATE.md`):

```markdown
# YYYY-MM-DD: short-title

## Context
- What problem or pressure triggered this decision?
- What constraints were relevant (technical, product, timeline)?

## Decision
- What was chosen?
- What is in scope and out of scope for this decision?

## Alternatives Considered
- Option A: summary, pros, cons.
- Option B: summary, pros, cons.

## Consequences
- Positive outcomes expected.
- Trade-offs accepted.
- Risks introduced and mitigation approach.

## Follow-ups
- Required implementation tasks.
- Required documentation updates.
- Validation or rollback notes.
```

Link the ADR from the corresponding `changelog.md` entry using a relative path: `archive/YYYY-MM-DD-short-title.md`.

#### 5. Plan → ADR promotion (required for completed plans)

Once a plan in `dev-docs/plans/` is fully executed, it MUST be moved to `archive/`. This keeps `plans/` as a signal of future/present direction only.

1. Move the plan file from `plans/` to `archive/YYYY-MM-DD-short-title.md`.
2. Prepend a completion note. Use a **full ADR** (Context/Decision/Alternatives/Consequences) for architecture-changing decisions (schema changes, renderer contracts, build pipeline). Use a **short completion note** (`> **Completion note:** ...`) for straightforward feature work.
3. Update `roadmap.md` — move the item from Now/Next to Recently Completed.
4. Add a `changelog.md` entry referencing the archive path: `- **Archive:** archive/YYYY-MM-DD-short-title.md`
5. Remove the plan from `plans/` directory.

> **Rule of thumb:** `plans/` = future intent or active work. `archive/` = what we already did. If a file is in `plans/`, the next agent should assume it's still relevant. If it's in `archive/`, it's history.

#### 6. Report

Summarize what was updated and why. Example:

> Updated `requirements.md` (new user story for search), added `changelog.md` entry, created ADR at `archive/2026-05-13-search-feature.md`.
