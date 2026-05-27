# 2026-05-27: prd0048 — Container/Presenter Pattern

## Context
- Components directly imported and subscribed to a global Zustand singleton (`useGraphStore`), making them impossible to render in isolation for Storybook or unit tests.
- Story stories relied on the global seed state and leaked mutations between stories via the shared singleton.
- Adding a new story required either duplicating context provider boilerplate (e.g., `SidebarProvider`) or accepting uncontrolled store state.
- This pattern was identified as the primary source of friction with Storybook — not Storybook itself, but the hidden coupling.

## Decision
- **Container/Presenter split:** Each stateful component is split into two files:
  - `*Section.tsx`: pure presenter — accepts everything as props, zero side effects, zero store imports.
  - `*SectionContainer.tsx`: owns store reads, async orchestration, dialog state, effects. Renders the presenter.
- **Default export is the presenter** (clean imports in stories). Container is also a default export.
- **`AppSidebar` imports containers** — it already reads `viewport` from the store, which it passes to `WorkspaceInfoSectionContainer`.
- **Stories target the presenter** with explicit `args` and `fn()` callbacks. Interactive stories use stateful `render` wrappers.
- Future migrations across the project follow the same pattern.

## In Scope
- Three sidebar sections under `src/canvas/panels/sections/`.
- Shared `withSidebarSection` decorator in `.storybook/decorators.tsx`.
- Story files updated to pass explicit props.

## Out of Scope
- `AppSidebar` itself (still has a direct store read for `viewport` — deferred to a future pass).
- Components outside `sections/` (GraphCanvas, TiptapSidebar, EdgeLabel — deferred to project-wide migration).
- Tests for the containers (called out as a follow-up — the presenters are testable; container logic is thin enough to verify through integration tests).

## Alternatives Considered

### Option A: Keep singletons, add mocking layer
- Wrap Zustand store in a provider or context so stories can inject mock state.
- **Pros:** No file splitting, minimal code churn.
- **Cons:** More complex test setup (mocking is always fragile), doesn't improve component architecture, hides dependencies.

### Option B: Argify AppSidebar (prop drill everything)
- AppSidebar reads the store and passes all data down to sections as props.
- **Pros:** Single file change, no container files.
- **Cons:** Prop drilling at scale — AppSidebar would need to know about feature flags, backup state, undo/redo, folders, etc. Violates SRP.

### Option C: Container/Presenter (chosen)
- Each section owns its container; the orchestrator (AppSidebar) just places containers.
- **Pros:** Each concern is isolated, containers are thin and replaceable, presenters are trivially testable, scales naturally.
- **Cons:** More files (one extra per section), requires architectural discipline.

## Consequences
- **Positive:** All 5 sidebar stories now pass with explicit props. Adding a new section means writing a presenter (storied immediately) + a container (thin).
- **Positive:** Pattern is simple enough to apply project-wide without a dedicated migration — teams can convert files as they touch them.
- **Positive:** Eliminates state leakage between stories (each story gets fresh `fn()` callbacks).
- **Trade-off:** Presenter props interfaces are verbose (especially BackupsSection with ~20 props). This is intentional — every prop is an explicit dependency.
- **Risk:** Presenter and container can drift (e.g., presenter expects a prop the container doesn't pass). Mitigated by TypeScript.

## Follow-ups
- Migrate `AppSidebar` itself to container/presenter.
- Migrate remaining store-coupled components (GraphCanvas, TiptapSidebar, EdgeLabel).
- Write unit tests for container orchestration logic (async backup flows, dialog state machine).
