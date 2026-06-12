# M9 — Shared Chrome & View Switcher

## Overview

Extract the workspace shell (`SidebarProvider`, `AppSidebar`, shared sidebar sections) out of `GraphCanvas` into a shared `WorkspaceShell` component. Add a `ViewSwitcher` to the shell header so multiple views can share the same chrome. `GraphCanvas` becomes a pure canvas view with no sidebar ownership.

After M9, switching between views works from the top bar — the canvas view is identical, and a stub text view placeholder confirms the wiring.

## Specification / Acceptance Criteria

1. `WorkspaceShell` wraps all views in `SidebarProvider`, renders `AppSidebar` on the right and a `ViewSwitcher` in the top bar.
2. `GraphCanvas` no longer owns `SidebarProvider` or `AppSidebar`. It exports a pure canvas content component.
3. `ViewSwitcher` shows at least two entries ("Graph" and "Text"). Active view is stored in a Zustand `activeView` slice or URL search param.
4. Switching to "Graph" renders the canvas. Switching to "Text" renders a placeholder div (the stub for M10).
5. `AppSidebar` gracefully handles both views — canvas-specific sections (`CanvasLayoutSection`, `SelectionMetadataSection`) only appear when the canvas view is active.
6. `onOpenFolder` (FSAdapter picker) moves from `GraphCanvas` into `WorkspaceShell` so open-folder works from any view.
7. Sidebar sections that are view-agnostic (`BackupsSection`, `WorkspaceInfoSection`, `FeatureFlagsSection`) appear in both views.
8. No visual regression on the canvas view — existing layout, controls, and sidebar behavior are identical.
9. Workspace init flow (`resolveAdapter()` → `init()`) moves into `WorkspaceShell` so all views share the same boot sequence.

## Files changed (inferred)

- `src/components/WorkspaceShell.tsx` — **New.** Shared layout: SidebarProvider > sidebar header with ViewSwitcher > SidebarInset (children) + AppSidebar (right).
- `src/canvas/GraphCanvas.tsx` — Strip SidebarProvider and AppSidebar. Move onOpenFolder out. Export as pure canvas content.
- `src/canvas/panels/AppSidebar.tsx` — Accept `activeView` prop. Gate canvas-specific sections on `activeView === "graph"`.
- `src/store/useGraphStore.ts` — Add `activeView` state + `setActiveView` action.
- `src/routes/WorkspaceRoot.tsx` — Replace direct GraphCanvas with WorkspaceShell > GraphCanvas.
- `src/routes/LegacyApp.tsx` — Optional: wrap in WorkspaceShell for migration. Mark for deprecation.
- `src/App.tsx` — Route structure simplified if WorkspaceShell handles all routing internally.

## Phases

### Phase 1: Create WorkspaceShell
- Extract SidebarProvider + AppSidebar + onOpenFolder + init flow into `WorkspaceShell.tsx`.
- WorkspaceShell takes `children` (the active view component).
- Move `onOpenFolder` callback (the FSAdapter picker dialog) from GraphCanvas into WorkspaceShell.
- Wire `onRunLayout` as an optional prop that canvas views pass down; WorkspaceShell bridges it to AppSidebar.

### Phase 2: Decouple AppSidebar from canvas
- Add `activeView` prop to AppSidebar.
- Gate `CanvasLayoutSectionContainer` and `SelectionMetadataSectionContainer` on `activeView === "graph"`.
- Keep `BackupsSection`, `WorkspaceInfoSection`, `FeatureFlagsSection` always visible.

### Phase 3: Add ViewSwitcher
- Button group in the sidebar header or shell top bar with "Graph" and "Text" buttons.
- Clicking a button calls `setActiveView()` on the Zustand store.
- WorkspaceShell reads `activeView` and renders the corresponding component.
- Text view renders a styled placeholder: `"Text view — coming in M10"`.

### Phase 4: Verify no regression
- Canvas view identical to before — same panels, sidebar sections, zoom controls, context menu.
- Sidebar toggle (SidebarTrigger) still works.
- Open Folder, Save, Close Workspace all work identically.
- Undo/Redo, Zoom, and other canvas controls unaffected.

## Size advisory

Medium — three new/modified components. No new state beyond `activeView`. WorkspaceShell is ~60 lines. AppSidebar changes are cosmetic (view gating). GraphCanvas loses ~15 lines of layout code.

## Dependencies

- M6 (FSAdapter, WorkspaceShell init flow) — done.
- M7 (SegmentCard, ContainerCard, ContentEditor) — done, provides portable card components for M10.
- M9 blocks M10 — the ViewSwitcher and WorkspaceShell are prerequisites.
