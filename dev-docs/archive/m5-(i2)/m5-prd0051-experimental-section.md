> **Completion note (2026-05-28):**
> - **What was built:** CollapsibleSection component, ViewLogger display + feature flags, MiniMap toggle, font-size reset, Switch label size reduction, sidebar section reorder.
> - **Key decisions:** CollapsibleSection uses Base UI `render` prop to render as SidebarGroupLabel; caret rotation uses `group` + `data-panel-open` pattern; feature flags persisted to localStorage.
> - **Deviations from plan:** None — all acceptance criteria met.
> - **Postponed:** None.

# PRD 0051: Experimental Section — Sidebar Section Component, ViewLogger, and Toggle Controls

## Overview

Refine the sidebar collapsible sections: extract the shared CollapsibleSection component with rotating caret, rename "Feature Flags" to "Experimental", add ViewLogger and MiniMap toggles, add a ViewLogger display to the top-right button group, and set a global `:root { font-size: 16px }` reset.

## Specification / Acceptance Criteria

- **[x]** Font-size reset: `:root { font-size: 16px }` in `index.css` overrides browser default to match Storybook
- **[x]** Switch label uses `text-xs` (12px) instead of `text-sm` — matches sidebar section label size
- **[x]** "Feature Flags" section renamed to "Experimental"
- **[x]** New `CollapsibleSection` component in `src/canvas/panels/sections/CollapsibleSection.tsx`
  - Wraps `Collapsible` + `SidebarGroup` + `SidebarGroupContent`
  - CollapsibleTrigger renders as `SidebarGroupLabel` via Base UI `render` prop
  - Caret rotates: `-rotate-90` by default (pointing right), `group-data-[panel-open]:rotate-0` when expanded (pointing down)
  - `gap-1.5` between caret icon and title text
  - `group` class on trigger enables child `group-data-*` selectors
- **[x]** All three sidebar sections refactored to use `CollapsibleSection`:
  - `FeatureFlagsSection`, `BackupsSection`, `WorkspaceInfoSection`
  - Each drops ~15 lines of boilerplate and 5+ imports
  - Each section retains its own content `gap` and internal layout
- **[x]** Sidebar section order: Backups → Workspace Info → Experimental (Experimental last)
- **[x]** New `ViewLogger` component in `src/canvas/panels/ViewLogger.tsx`
  - Reads viewport from React Flow's `useStore` (`s.transform`)
  - Displays `x: {n} | y: {n} | {zoom}%` in a monospace pill
  - Renders in the top-right button group, left of ZoomControls
- **[x]** Feature flags added to `DEFAULT_FEATURE_FLAGS`:
  - `viewLogger: true` — toggles ViewLogger visibility
  - `minimap: true` — toggles MiniMap visibility
- **[x]** GraphCanvas conditionally renders ViewLogger and MiniMap based on feature flags
- **[x]** Labels for all three flags in `FEATURE_FLAG_LABELS`

## Files Changed

- `src/index.css` — added `:root { font-size: 16px }` reset
- `src/components/ui/switch.tsx` — label changed from `text-sm` to `text-xs`
- `src/canvas/panels/sections/CollapsibleSection.tsx` — **new**: shared collapsible section component
- `src/canvas/panels/sections/FeatureFlagsSection.tsx` — refactored to use CollapsibleSection, renamed label to "Experimental", added viewLogger/minimap labels
- `src/canvas/panels/sections/BackupsSection.tsx` — refactored to use CollapsibleSection
- `src/canvas/panels/sections/WorkspaceInfoSection.tsx` — refactored to use CollapsibleSection
- `src/canvas/panels/ViewLogger.tsx` — **new**: viewport display component
- `src/canvas/GraphCanvas.tsx` — conditional rendering of ViewLogger and MiniMap, added ViewLogger to button group
- `src/canvas/panels/AppSidebar.tsx` — moved FeatureFlagsSectionContainer to last position
- `src/store/useGraphStore.ts` — added `viewLogger` and `minimap` to `DEFAULT_FEATURE_FLAGS`

## Phases

Single pass — all work was done incrementally in one session.

## Size Advisory

Medium — 10 files, but most changes are mechanical refactoring or small additions.
