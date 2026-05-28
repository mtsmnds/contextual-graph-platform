> **Completion note (2026-05-28):**
> - **What was built:** Right-side floating sidebar replacing WorkspaceMenu popover. Three collapsible sections (Feature Flags, Backups, Workspace Info). SidebarTrigger replaces DotsThreeOutline. Sidebar state persisted via shadcn cookie mechanism. Feature flags persisted to localStorage with `dragToNest` flag. All sections are context-independent containers with stories.
> - **Key decisions:** Used shadcn sidebar primitives (`collapsible="offcanvas"`, `side="right"`). Sections are independent of React Flow — only depend on Zustand store. Feature flags stored in store with localStorage persistence.
> - **Deviations from plan:** None — scope matched plan exactly.
> - **Postponed:** None.

# PRD0047 — Workspace Sidebar

## Overview

Replace the current `WorkspaceMenu` popover with a persistent right-aligned floating sidebar that stays open while the user interacts with the canvas. The sidebar hosts collapsible sections for feature flags, backups, and workspace info. Uses the existing shadcn `Sidebar` primitives (`src/components/ui/sidebar.tsx`).

**Naming rationale:** The main component is called `WorkspaceSidebar` — not `CanvasSidebar` — because its internals (sections for feature flags, backups, workspace info) are context-independent. They only depend on the Zustand store, not on React Flow or the canvas. This means the same sections can be reused in other routes or layouts by wrapping them in a `SidebarProvider` with a different parent. The current use case happens to be the canvas, but the component is not coupled to it.

**Storybook:** All new section components and the sidebar itself get Storybook stories with play functions, replacing the old `WorkspaceMenu` stories. Feature flag toggle interactions, backup save/restore flows, and section collapse/expand are all covered.

---

## Specification / Acceptance Criteria

### User Stories

#### US1: Sidebar opens/closes from the right side
- A toggle button in the top-right `Panel` (replaces the current `DotsThreeOutline` WorkspaceMenu trigger) opens and closes the sidebar
- Sidebar slides in from the right as a floating overlay — no layout shift to the canvas (uses shadcn `collapsible="offcanvas"`)
- Clicking the toggle button closes the sidebar
- `Cmd+B` / `Ctrl+B` keyboard shortcut toggles the sidebar (inherited from shadcn `SidebarProvider`)

#### US2: Sidebar stays visible while interacting with the canvas
- Unlike the current `WorkspaceMenu` Popover (which closes on click-outside), the sidebar remains open when clicking, panning, selecting, or editing in the canvas
- The sidebar floats above the canvas and does not overlap with the minimap (moved bottom-right — minimap + zoom controls)

#### US3: State persists across sessions
- Open/closed state persisted via the shadcn sidebar cookie mechanism (`SIDEBAR_COOKIE_NAME`)
- Expanded/collapsed state of each section persisted via `localStorage`
- On reload, both sidebar visibility and section states restore exactly

#### US4: Three collapsible sections
- **Feature Flags** — toggle switches for feature flags (starts with `dragToNest`)
- **Backups** — all backup controls migrated from `WorkspaceMenu` (save checkpoint, manual backups list, recent snapshots, restore/delete, auto-snapshot prompt)
- **Workspace Info** — folder name, entity count, undo/redo buttons, viewport position (x/y/zoom, moved from bottom-right panel)
- Sections expand/collapse independently via `Collapsible` wrapper
- Default: Feature Flags and Backups expanded, Workspace Info collapsed

#### US5: Feature Flags section
- Displays toggle controls for each feature flag
- First flag: `dragToNest` (default: disabled) — gates the drag-to-assign logic in `GraphCanvas.tsx`
- Toggling updates the Zustand store's `featureFlags` field
- Additional flags can be added by adding entries to a `FEATURE_FLAGS` registry

#### US6: Backups section (migrated from WorkspaceMenu)
- "Save checkpoint now" button
- Manual backups list with restore/delete actions per entry
- Recent snapshots list (from undo stack)
- Auto-snapshot restoration prompt when unsaved snapshots exist
- "Open Folder" button (also available here)

#### US7: Workspace Info section
- Current folder name (if using File System Access adapter)
- Entity count
- Undo/Redo buttons with descriptions
- Viewport position display (x, y, zoom percentage) — previously in bottom-right Panel

#### US8: Undo/Redo remain keyboard-accessible
- `Cmd+Z` / `Cmd+Shift+Z` continue to work regardless of sidebar state
- Undo/Redo buttons in the sidebar are a secondary access path

#### US9: Dark mode
- Sidebar respects the app's dark mode theme via existing CSS variables (`--sidebar-*` variables in `index.css`)

### Edge Cases

- **Sidebar open on narrow viewports:** Should use the mobile Sheet behavior (existing shadcn sidebar behavior)
- **Sidebar with FS Access:** Open Folder button still works from inside sidebar
- **Sidebar with empty workspace:** Backup section shows "Nothing to back up yet" (same as current WorkspaceMenu)
- **No feature flags defined:** Feature Flags section shows "No feature flags available" placeholder
- **Sidebar toggle while sidebar is animating:** Debounce or ignore rapid toggles

---

### Context-Independent Sections (reusable)

The sidebar sections (`FeatureFlagsSection`, `BackupsSection`, `WorkspaceInfoSection`) are extracted as independent components. They have no dependency on the canvas or React Flow — they only require `SidebarProvider` context (for the sidebar container) and the Zustand store (for data). This means:

- In `WorkspaceRoot` (canvas route): composed as a right-floating `WorkspaceSidebar` alongside `GraphCanvas`
- In other routes (future): can be embedded in any layout by wrapping in `SidebarProvider` and using the sections directly
- The sections themselves are pure content components — they don't know or care about their parent layout

### Component Tree

```
SidebarProvider (wraps WorkspaceRoot — persists across route changes)
├── GraphCanvas (canvas content — unchanged)
│   └── Panel position="top-right"
│       └── SidebarTrigger (replaces DotsThreeOutline WorkspaceMenu trigger)
├── WorkspaceSidebar (side="right", collapsible="offcanvas")
│   ├── SidebarHeader
│   │   └── Title + close button
│   ├── SidebarContent
│   │   ├── FeatureFlagsSection
│   │   │   └── Collapsible → SidebarGroup → toggle list
│   │   ├── BackupsSection
│   │   │   └── Collapsible → SidebarGroup → backup controls
│   │   └── WorkspaceInfoSection
│   │       └── Collapsible → SidebarGroup → info + undo/redo
│   └── SidebarFooter
│       └── Open Folder button
```

### Key Decisions

- **New component:** `WorkspaceSidebar` — not an evolution of the `WorkspaceMenu` popover. A fundamentally different UI pattern (persistent sidebar vs transient popover).
- **Sections as independent components:** `FeatureFlagsSection`, `BackupsSection`, `WorkspaceInfoSection` — each is a standalone component that can be used in any sidebar context. They depend only on the Zustand store, not on the canvas.
- **Sidebar primitives:** Use the existing shadcn sidebar system (`src/components/ui/sidebar.tsx`) which already supports `side="right"`, `collapsible="offcanvas"`, mobile Sheet view, cookie-based state persistence, and Base UI compatibility.
- **Feature flag state:** Stored in Zustand store under `featureFlags: Record<string, boolean>` with localStorage persistence. Separate from sidebar state.
- **Section state:** Expanded/collapsed per section stored in `localStorage` under a `sidebar-sections` key.
- **Toggle button:** Replace the `DotsThreeOutline` icon with `SidebarTrigger` (using Phosphor's `PanelRight` or equivalent icon).

### Files Changed

| File | Change |
|------|--------|
| `src/canvas/panels/WorkspaceSidebar.tsx` | **NEW** — sidebar container (composes sections into shadcn sidebar) |
| `src/canvas/panels/sections/FeatureFlagsSection.tsx` | **NEW** — feature flag toggles section |
| `src/canvas/panels/sections/BackupsSection.tsx` | **NEW** — backup controls section (migrated from WorkspaceMenu) |
| `src/canvas/panels/sections/WorkspaceInfoSection.tsx` | **NEW** — workspace info section |
| `src/canvas/GraphCanvas.tsx` | Remove WorkspaceMenu + Popover Panel; add SidebarProvider + WorkspaceSidebar + SidebarTrigger |
| `src/canvas/panels/WorkspaceMenu.tsx` | **REMOVED** — fully replaced |
| `src/store/useGraphStore.ts` | Add `featureFlags` slice with localStorage persistence |
| `src/components/ui/sidebar.tsx` | Minor: replace `PanelLeftIcon` (lucide) with Phosphor equivalent |
| `src/stories/WorkspaceMenu.stories.tsx` | **REMOVED** — replaced by WorkspaceSidebar stories |
| `src/stories/WorkspaceSidebar.stories.tsx` | **NEW** — stories for sidebar + each section |
| `dev-docs/requirements.md` | Add sidebar + feature flag requirements |
| `dev-docs/architecture.md` | Update component tree and state management |

### Persistence Strategy

| Data | Mechanism | Key |
|------|-----------|-----|
| Sidebar open/closed | Cookie (via shadcn `SIDEBAR_COOKIE_NAME`) | `sidebar_state` |
| Section expanded/collapsed | `localStorage` | `sidebar-sections` |
| Feature flag values | `localStorage` (read on store init) | `feature-flags` |

---

## Tests

### Unit Tests (vitest, pure logic)

- Feature flag defaults are correct
- Feature flags can be toggled on/off
- Feature flag changes persist to localStorage
- Sidebar section state defaults to expected values
- Feature flag gates work (e.g., drag-to-assign blocked when flag is off)

### Integration Tests

- Feature flags update propagates to canvas behavior (drag-to-nest gated)
- Backup controls work correctly from sidebar (save, list, restore, delete)
- Open Folder button opens file picker
- Undo/Redo buttons trigger store actions

### Manual Verification (dev server)

- Sidebar opens/closes from right side
- Sidebar stays open while panning/clicking/editing in canvas
- Sidebar does not overlap minimap
- Sidebar state persists across page reload
- Feature flag toggle works (reload canvas, verify drag-to-nest is disabled)
- All backup operations work from sidebar
- No visual regressions on the canvas

---

## Storybook

### New Stories

| Story File | Stories | Play Function? |
|------------|---------|----------------|
| `WorkspaceSidebar.stories.tsx` | Default (open), closed, each section expanded/collapsed | Open/close toggle via SidebarTrigger |
| `FeatureFlagsSection.stories.tsx` | Default (dragToNest disabled), enabled, multiple flags | Toggle a flag → verify store update |
| `BackupsSection.stories.tsx` | Empty state, with backups, with auto-snapshot prompt | Save checkpoint interaction |
| `WorkspaceInfoSection.stories.tsx` | With FS Access (folder name shown), without, undo/redo states | Undo/Redo button clicks |

### Storybook Test Coverage

- All new stories run via `npx vitest --project=storybook` as part of CI
- Play functions verify the critical interactions: flag toggle, backup operations, undo/redo

### Removed Stories

- `WorkspaceMenu.stories.tsx` — replaced by the new sidebar stories

---

## Size Advisory

~12 files changed (7 new + 5 modified), ~500 lines added, ~450 lines removed. Single pass — no phases needed.

---

## Dependencies

- shadcn sidebar primitives (already present)
- `@phosphor-icons/react` (already present)
- Zustand `featureFlags` store slice (add to existing store)
- `Collapsible` component from shadcn (check if installed)
