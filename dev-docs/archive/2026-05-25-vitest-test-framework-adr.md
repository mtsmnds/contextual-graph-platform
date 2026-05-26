# 2026-05-25: vitest test framework

## Context
- AGENTS.md was updated to require vitest unit tests for pure functions, store actions, and state transitions, but the project had no test framework installed or configured.
- requirements.md stated "No test framework required (not yet configured)" — directly contradicting the new AGENTS.md policy.
- Several grid reference mismatches existed (documents said 15×15, code uses 16×16).

## Decision
- Adopt vitest v4 as the test framework with jsdom environment and `@/` path alias mirroring the vite config.
- Update all documentation (requirements, architecture, changelog) to reflect the new pipeline.
- Fix stale grid references in documentation to match the implemented 16×16 grid.
- Do NOT install @testing-library/react — tests are limited to logic, state transitions, and data transformations per AGENTS.md (no component rendering tests).

## Alternatives Considered
- **Jest:** Mature but slower and requires more configuration for ESM/Vite projects. No native Vite integration.
- **Vitest without jsdom:** Would work for pure logic tests but jsdom is needed for any store tests that touch localStorage or DOM APIs.
- **No test framework (status quo):** Rejected — directly contradicts AGENTS.md policy.

## Consequences
- Positive: `npx vitest run` is now part of pre-commit verification. Framework is zero-config for new tests.
- Positive: Documentation is consistent with the codebase (16×16 grid everywhere).
- Trade-off: jsdom adds ~33 packages and increases `node_modules` size. Not an issue for a desktop app.
- Risk: None significant — vitest is stable and widely adopted.

## Follow-ups
- Write unit tests per AGENTS.md guidelines (bug fixes → regression tests, pure functions/store actions → unit tests).
- The `test` script in `package.json` could be added later for convenience (`"test": "vitest run"`).
