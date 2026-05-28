> **Completion note (2026-05-28):**
> - **What was built:** Dynamic sidebar header (folderName from store), Undo/Redo moved to canvas top-right panel, disabled button styling fixed (solid muted colors instead of opacity-50).
> - **Key decisions:** Removed viewport coordinates from WorkspaceInfoSection (ViewLogger in panel replaces it). Removed undo/redo completely from sidebar.
> - **Deviations from plan:** Added disabled button fix (`disabled:opacity-50` → `disabled:text-muted-foreground/40 disabled:border-muted-foreground/20`) — discovered during implementation.
> - **Postponed:** None.

# PRD 0052: Canvas Top-Right Controls — Dynamic Header, Undo/Redo Relocation

## Overview

Two changes to the AppSidebar and canvas controls: (1) the sidebar header shows the current folder name instead of a static "Workspace" label, and (2) Undo/Redo buttons move from the Workspace Info sidebar section to the top-right canvas controls panel alongside ZoomControls and ViewLogger.

## Specification / Acceptance Criteria

### 1. Dynamic sidebar header
- `AppSidebar` reads `folderName` from the Zustand store
- If `folderName` is non-null, the sidebar header displays it (e.g. "hello")
- If `folderName` is null, fall back to "Workspace"
- The header retains its existing styling: `text-sm font-semibold`

### 2. Undo/Redo relocation
- Remove the Undo/Redo `ButtonGroup` and related label from `WorkspaceInfoSection.tsx`
- Remove the `onUndo`, `onRedo`, `undoStack`, `redoStack` props from `WorkspaceInfoSection`
- Add Undo and Redo `IconButton`s to the top-right `Panel` in `GraphCanvas.tsx`, between ViewLogger and ZoomControls
- The buttons use `ArrowUUpLeft` and `ArrowUUpRight` icons from `@phosphor-icons/react`
- The buttons show a tooltip/title with the current undo/redo description (e.g. "Undo move entity")
- Undo is disabled when `undoStack` is empty; Redo is disabled when `redoStack` is empty
- `import { useUndoRedo } from "@/engine/undo-redo"` or equivalent store access for `undoStack`, `redoStack`, `undo()`, `redo()`
- `npx tsc --noEmit` passes

### 3. Pre-existing (already done in PRD0051)
- Section order: Backups → Workspace Info → Experimental ✓
- Renamed "Feature Flags" to "Experimental" ✓
- MiniMap toggle switch in Experimental section ✓

## Files Changed

- `src/canvas/panels/AppSidebar.tsx` — read `folderName` from store, dynamic header text
- `src/canvas/panels/sections/WorkspaceInfoSection.tsx` — remove Undo/Redo props and buttons
- `src/canvas/panels/sections/WorkspaceInfoSectionContainer.tsx` — remove undo/redo store reads and prop passing
- `src/canvas/GraphCanvas.tsx` — add Undo/Redo buttons to top-right Panel group

## Phases

Single pass — two independent but small changes.

## Size Advisory

Small — ~4 files, straightforward prop removals and additions.
