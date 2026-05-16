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
| `dev-docs/roadmap.md` | Active priorities — flat Now/Next/Later lists. No milestones, no completed items (those go in changelog). |
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
| Priority, sequencing, future intent | `roadmap.md` — move items between Now/Next/Later. Remove completed items (they go in changelog). |
| Significant completed change | `changelog.md` — add entry with what/why/impact/files |
| Quick reference / operational note | `reminders.md` — add informal note |

**Roadmap structure rules:**
- Flat lists only — no milestones, phases, or numbered subsections.
- Three sections: `## Now`, `## Next`, `## Later`.
- No completed items — those belong in `changelog.md` only.
- Items should be concrete enough for an agent to pick up and implement.
- The "Architectural Direction" section is optional — if present, keep it to 1-2 sentences.

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

**Ordering rules:**
- **Most recent on top** — entries sorted newest-to-oldest by date.
- **One `## YYYY-MM-DD` per day** — group all entries from the same day under one date heading. No duplicate date headings.
- **Purpose/Rules section stays at the very top** — before any dated entries.
- Within a single day, entries can be in any order (chronological or significance).

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

---

## Mode: archive-plan

Use when a PRD in `dev-docs/plans/` has been fully executed and needs to be archived. This is a strict ordered workflow — do not skip steps, do not reorder.

### Steps

#### 1. Prepend an ADR-style completion note to the plan file

Open the plan file from `dev-docs/plans/`. Prepend a blockquote with the completion context:

```
> **Completion note (YYYY-MM-DD):**
> - What was built: brief summary
> - Key decisions: 1-2 bullet points on design choices made during implementation
> - Deviations from plan: anything that changed from the original PRD
> - Postponed: items explicitly deferred (link to roadmap if applicable)
```

For architecture-changing decisions (schema changes, renderer contracts, build pipeline), write a full ADR (Context/Decision/Alternatives/Consequences) instead of a short note.

#### 2. Promote to archive

Move the plan file from `dev-docs/plans/` to `dev-docs/archive/` using its current filename:

```
mv dev-docs/plans/{filename} dev-docs/archive/{filename}
```

> **Rule of thumb:** `plans/` = future intent or active work. `archive/` = what we already did. If a file is in `plans/`, the next agent should assume it's still relevant. If it's in `archive/`, it's history.

#### 3. Update the roadmap

If the completed PRD was listed in `dev-docs/roadmap.md`:
- Remove it from Now, Next, or Later — completed items do not stay in the roadmap.
- If the PRD defined out-of-scope or deferred items ("Phase 2", "future work", explicit "later" notes), append them to the appropriate section in `roadmap.md`. Preserve the user's original phrasing — do not rewrite or summarize.

#### 4. Add a changelog entry

Add a changelog entry to `dev-docs/changelog.md` following the changelog format rules (see Mode: update step 3 for format reference). Include:
- **Archive:** reference linking to the archived file
- **Files changed:** list of files modified during implementation

#### 5. Report

Summarize what was archived, what roadmap items were moved, and the changelog entry added.
