# PRD0015: Sidebar Home Navigation

> **Completion note:** Fully executed 2026-05-15. React Flow stripped from `App.tsx`. Popover sidebar replaced with permanent shadcn `Sidebar`. `HomePage` view created. Page creation and selection are single-click. `simple-editor.scss` fixed (`width: 100vw` → `100%`) to prevent horizontal overflow when sidebar is open.

**Status:** Complete
**Prerequisite:** TipTap integration (PRD0013)
**Output:** App side, full rework.

---

## 1. The Problem

The app is a Jekyll-and-Hyde dual-mode app (canvas vs. reading viewport) switched by a single Zustand value (`focusedEntityId === null`). Every change to the canvas path risks destabilising the editor path. The sidebar is hidden behind a floating popover, making page navigation a two-click detour. React Flow is an unused distraction while the core interaction model (contextual reading + rich text editing) still needs validation.

## 2. What We're Doing

Strip React Flow from the app entirely. Replace the floating popover sidebar with a permanent shadcn Sidebar. Replace the canvas view with a Notion-style home page showing root containers. Page creation and selection become single-click operations from the sidebar.

### 2.1 What Gets Removed

- `CanvasView` component and its helper functions (`assignLayout`, `toReactFlowNodes`, `toReactFlowEdges`)
- `import { ReactFlow }` and `import "@xyflow/react/dist/style.css"`
- The `?view=graph` URL branch
- The `focusedEntityId === null ? <CanvasView />` conditional render
- The "Canvas View" button from the sidebar
- `SidebarPopover` — replaced by permanent sidebar

`@xyflow/react` stays in `package.json` (reintroduced in Phase 4) but is no longer imported, so it won't be bundled.

### 2.2 What Gets Added

- **`src/components/AppSidebar.tsx`** — permanent left sidebar using shadcn `Sidebar` + `SidebarProvider`:
  - "Home" link at top — resets to root container list
  - Root containers listed below as clickable menu items with icons
  - Active page highlighted
  - "+ New page" button in the footer
  - Folder name shown in the footer
  - Collapsible (offcanvas) on desktop, sheet on mobile

- **`src/components/HomePage.tsx`** — landing page when no page is selected:
  - Folder name as heading
  - Root containers listed as clickable cards
  - "+ New page" call-to-action
  - Welcome message when no pages exist

### 2.3 What Changes

- **`src/App.tsx`** — new layout:

```
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <SidebarTrigger />
    {focusedEntityId ? <ReadingViewport /> : <HomePage />}
  </SidebarInset>
</SidebarProvider>
```

No store changes needed. `focusedEntityId === null` now means "show home" instead of "show canvas."

### 2.4 Page Creation Flow

1. User clicks "+ New page" in sidebar or home page
2. `addEntity("container", { title: "Untitled" })` creates a new container
3. `focusEntity(id)` sets it as active
4. ReadingViewport's empty-container branch renders a full-width TipTap editor

## 3. Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Strip React Flow, replace layout with SidebarProvider + AppSidebar + HomePage/ReadingViewport |
| `src/components/AppSidebar.tsx` | **New** — shadcn sidebar with page list, home link, new page button |
| `src/components/HomePage.tsx` | **New** — root container cards + new page CTA |
| `dev-docs/plans/prd0015-sidebar-home-navigation.md` | This plan — promoted to archive after execution |
| `dev-docs/architecture.md` | Update module map (remove canvas adapters, add AppSidebar/HomePage) |
| `dev-docs/roadmap.md` | Move React Flow items to Later, promote sidebar/home to Recently Completed |

## 4. Out of Scope

- Tree sidebar (expandable `contains` hierarchy) — Phase 3
- Page reordering, renaming, deleting — future
- Drag-and-drop page reorder in sidebar — future
- React Flow — Phase 4
