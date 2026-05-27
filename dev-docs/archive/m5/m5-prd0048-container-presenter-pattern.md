> **Completion note (2026-05-27):**
> - **What was built:** Container/presenter split for all three sidebar sections, shared `withSidebarSection` decorator, updated stories with explicit args.
> - **Key decisions:** Container owns store reads + async ops + dialog state. Presenter is pure render with explicit props. Stories target presenters with `fn()` callbacks.
> - **Deviations from plan:** None — all three phases completed as specified.
> - **Postponed:** AppSidebar container/presenter split, project-wide migration.

# PRD 0048: Container/Presenter Pattern for AppSidebar Sections

## Overview

Extract store access from sidebar section components into container wrappers, leaving pure presenters with explicit props. This decouples rendering from state management, making components testable in isolation and trivially storybookable. Pattern established here will serve as the template for a project-wide migration.

## Specification / Acceptance Criteria

- **FeatureFlagsSection**: accepts `{ flags: Record<string, boolean>; onToggle: (key: string) => void }` as props. Container reads `featureFlags` and `setFeatureFlag` from `useGraphStore`.
- **WorkspaceInfoSection**: accepts `{ folderName: string | null; entityCount: number; undoStack: UndoEntry[]; redoStack: UndoEntry[]; undo: () => void; redo: () => void; viewport?: Viewport }` as props. Container reads all from `useGraphStore`.
- **BackupsSection**: accepts state + callbacks as props. Container owns dialog state, backup engine calls, and store access.
- **AppSidebar**: imports containers, not presenters. No direct store access (viewport already passed as prop).
- **BackupsSection story**: presenters receive explicit story args instead of relying on global seed state (or at least document the state dependency).
- **All 3 stories**: updated to pass explicit props to presenters (with data matching seed state by default).
- `npx tsc --noEmit` passes.
- Storybook dev server starts without errors.

## Files Changed

- `src/canvas/panels/sections/FeatureFlagsSection.tsx` — convert to presenter, add props
- `src/canvas/panels/sections/FeatureFlagsSectionContainer.tsx` — new: reads store, renders presenter
- `src/canvas/panels/sections/WorkspaceInfoSection.tsx` — convert to presenter, add props
- `src/canvas/panels/sections/WorkspaceInfoSectionContainer.tsx` — new: reads store, renders presenter
- `src/canvas/panels/sections/BackupsSection.tsx` — convert to presenter, add props
- `src/canvas/panels/sections/BackupsSectionContainer.tsx` — new: reads store, manages dialogs, renders presenter
- `src/canvas/panels/AppSidebar.tsx` — import containers instead of presenters
- `src/stories/FeatureFlagsSection.stories.tsx` — pass explicit args
- `src/stories/WorkspaceInfoSection.stories.tsx` — pass explicit args
- `src/stories/BackupsSection.stories.tsx` — pass explicit args to presenter

## Phase 1 — FeatureFlagsSection (simplest, establish pattern)
- **Testable by:** `npx tsc --noEmit`, storybook dev

## Phase 2 — WorkspaceInfoSection (props only, no own state)
- **Testable by:** `npx tsc --noEmit`, storybook dev

## Phase 3 — BackupsSection (most complex, owns dialog+async state in container)
- **Testable by:** `npx tsc --noEmit`, storybook dev

## Size Advisory

~8 files, ~3 related components, well-understood pattern. Single-pass implementation is fine but split into phases for review clarity.
