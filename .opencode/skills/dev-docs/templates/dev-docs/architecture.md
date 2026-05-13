# Architecture

## Purpose
How the system is designed and where core responsibilities live.

## System Style
- Architecture style: <!-- e.g. Python pipeline, React SPA, Go microservices -->
- Deployment style: <!-- e.g. static hosting, Docker, serverless -->
- Execution model: <!-- e.g. CLI, daemon, request-response -->

## Tech Stack
- <!-- Language / runtime -->
- <!-- Key frameworks / libraries -->
- <!-- Data formats -->
- <!-- Infrastructure -->

## Build Pipeline
Entrypoint: <!-- command -->

1. **Stage 1** — <!-- purpose, inputs, outputs -->
2. **Stage 2** — <!-- purpose, inputs, outputs -->

## Data Contracts

### Input
- <!-- source format, required/optional fields -->

### Output / State
- <!-- artifact formats, folder conventions -->

## Module Map

| Path | Role |
|------|------|
| <!-- src/ --> | <!-- --> |
| <!-- lib/ --> | <!-- --> |

## Change Impact
- Schema change → update this doc + `requirements.md`.
- Pipeline change → update this doc + `changelog.md` + ADR.

## Verification
<!-- Steps to verify correctness after changes. -->

## Related Docs
- `requirements.md` — intent and constraints.
- `roadmap.md` — priorities.
- `changelog.md` — history.
- `AGENTS.md` — operating conventions.
