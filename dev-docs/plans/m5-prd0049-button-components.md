# PRD 0049: Project-Wide Button Components (IconButton + ZoomControls)

## Overview

Standardize all icon buttons to a consistent 32px size by creating a project-level `IconButton` component and a `ZoomControls` component. Extract SidebarTrigger's size into the locked pattern. All components get stories.

## Pass 1 — IconButton

- Create `src/components/ui/icon-button.tsx`
- Wraps `<Button size="icon" />` — locks `size` to `"icon"` (32px), passes all other props through
- TypeScript: `Omit<React.ComponentProps<typeof Button>, 'size'>` for props
- Story at `src/stories/IconButton.stories.tsx` — Default, WithIcon, Disabled, ClickInteraction
- SidebarTrigger and ZoomControls use it later

## Pass 2 — ButtonGroup

- ButtonGroup already exists at `src/components/ui/button-group.tsx`
- No code changes needed (already handles `size` correctly)
- Story at `src/stories/ButtonGroup.stories.tsx` — already exists with 4 stories
- Verify it works with IconButton children

## Pass 3 — SidebarTrigger

- In `src/components/ui/sidebar.tsx`: change internal `<Button>` to `<IconButton variant="ghost">`
- Lock `size` — callers cannot override it to a different size
- Update story `src/stories/AppSidebar.stories.tsx` if needed

## Pass 4 — ZoomControls

- Create `src/canvas/panels/ZoomControls.tsx`
- Accepts `{ onZoomIn, onZoomOut, onFitView, onZoom100 }` callbacks
- Uses `<IconButton>` inside `<ButtonGroup>`
- Story at `src/stories/ZoomControls.stories.tsx` — Default, Callbacks via fn()
- Update `GraphCanvas.tsx` to import and use ZoomControls, remove inline buttons

## Verification

- Each pass: `npx tsc --noEmit` + storybook dev check
- Final: `npm run build`
- All stories render correctly with consistent 32px sizing
