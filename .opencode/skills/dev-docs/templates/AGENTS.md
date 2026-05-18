# AGENTS Guide

## Project Overview

<!-- Describe the project in 1-2 sentences: language/runtime, framework, what it does, where source/output live. -->

## Build

```sh
<!-- Canonical build command -->
```

<!-- Describe pipeline stages, incremental build behavior, caching. -->

## Test

```sh
<!-- Test command -->
```

<!-- Test framework, how to run a single test, linting/formatting/CI setup. -->

## Secrets

<!-- List secret files, what they contain, gitignore/commit policy. -->

## Doc System (dev-docs/)

| File | Purpose |
|------|---------|
| `requirements.md` | Feature intent, user stories, acceptance criteria |
| `architecture.md` | System design, contracts, build flow |
| `roadmap.md` | Active priorities (Now/Next/Later) |
| `changelog.md` | Completed significant changes with rationale |
| `archive/` | ADR files + executed plans |
| `plans/` | Design blueprints for future features |

### Documentation Map

- `readme.md` — human-first project entrypoint and quickstart.
- `dev-docs/requirements.md` — product goals, user stories, non-functional constraints.
- `dev-docs/architecture.md` — system design, contracts, module responsibilities, build flow.
- `dev-docs/roadmap.md` — current priorities and future backlog.
- `dev-docs/changelog.md` — completed significant changes and rationale.
- `dev-docs/archive/` — ADRs linked from significant changelog entries.

### Read Order (before implementing changes)

1. `readme.md` — human quickstart and project orientation.
2. `requirements.md` — what/why (feature intent, acceptance criteria).
3. `architecture.md` — how/contracts (system design, data contracts, pipeline).
4. `roadmap.md` — priority (what to do now vs later).
5. `changelog.md` + relevant ADRs — history/decisions.

## Conventions

<!--
  Project-specific conventions: template inheritance, naming rules, path rules,
  directory purposes, content/graph model rules.
-->

| Path | Role |
|------|------|
| <!-- `src/` --> | <!-- source content --> |
| <!-- `lib/` --> | <!-- pipeline logic --> |
| <!-- `out/` --> | <!-- build artifacts --> |
| <!-- `test/` --> | <!-- test suites --> |
