# Changelog

## Purpose
Significant completed changes with reasoning and references.
Use this to recover context after breaks.

## Entry Rules
- Completed, meaningful changes only (not tentative ideas).
- Short entries: what changed, why, impact.
- Significant design/process changes need a paired ADR in `archive/`.
- **Most recent on top** — newest entries first, grouped by date under `## YYYY-MM-DD`.

---

## 2026-06-07

### m5 — prd0066 — forced dimension render (programmatic node resize)
- **What:** Added `syncNodeDimensions()` — direct DOM manipulation on the node wrapper div inside `requestAnimationFrame` to trigger React Flow's native ResizeObserver → `updateNodeInternals` pipeline. Called after Stack Children and Run Layout operations. Four prior approaches all failed (setting `node.style`, `node.width`/`node.height`, `node.measured`, calling `updateNodeInternals` without DOM change — all blocked by NodeWrapper memoization in RF v12). The `dimChanged` tracking and `width`/`height` spread on the node object were removed as dead code. CanvasData `width`/`height` changed from optional to required. `snapCanvasDim` now always snaps (no conditional undefined passthrough). Seed data and all tests updated to include explicit `width`/`height`.
- **Why:** Programmatic dimension changes (Stack Children, dagre auto-layout) wrote correct data to the store and internal node but the DOM never updated without a page reload. React Flow v12's NodeWrapper memo ignores `node.width`/`height`/`style` changes from `setNodes`. The only reliable path is direct DOM manipulation → ResizeObserver → updateNodeInternals — the same pipeline NodeResizeControl uses.
- **Files changed:**
  - `src/canvas/GraphCanvas.tsx`: Added `syncNodeDimensions()`, calls from Stack Children and Run Layout handlers; removed dead `dimChanged` code
  - `src/types/graph.ts`: CanvasData `width`/`height` now required (not optional)
  - `src/store/useGraphStore.ts`: `snapCanvasDim` always snaps; `addEntity` default includes explicit width/height; migration defaults to 368×64
  - `src/data/seed.ts`: Container seed data includes explicit width/height
  - `src/store/migrate.test.ts`, `snap.test.ts`, `nesting.test.ts`, `workspace.test.ts`, `EntityNode.test.ts`: Updated for required width/height
- **Impact:** Stack Children and dagre auto-layout now visually resize containers without a page reload. Any future programmatic resize must follow the invariant: store update for persistence + `syncNodeDimensions(id, w, h)` for visual rendering.
- **Archive:** `dev-docs/archive/m5/m5-prd0066-forced-dimension-render.md`
- **ADR:** `dev-docs/archive/m5/2026-06-07-m5-prd0066-forced-dimension-render-adr.md`

### m5 — prd0068 — undo/redo dimension sync (post-hoc)
- **What:** Restructured the sync effect from `if (!autoLayout) { ... return }` to an `if/else` with shared `prevDims` capture before both branches and post-loop `syncNodeDimensions` after both branches. The dimension-sync code was only in the `!autoLayout` branch, but Stack Children requires `autoLayout=true` so undo/redo always took the `else` branch which had no sync — entity data restored correctly but the DOM never updated.
- **Why:** Undo/redo stopped working visually after PRD 0066 introduced `syncNodeDimensions`. Positions restored correctly (they go through React Flow's position pipeline which isn't memo-blocked), but container dimensions were stuck at the post-action size because the NodeWrapper memo ignored the `setNodes` style/width/height updates.
- **Files changed:**
  - `src/canvas/GraphCanvas.tsx`: `prevDims` capture moved before `if/else`, `if/return` converted to `if/else`, post-loop dimension sync placed after both branches
- **Impact:** Undo/redo after Stack Children (and any autoLayout operation) now restores container dimensions visually. The `if/else` structure is clearer about mutual exclusivity and any future shared post-entity-sync logic can go after it.
- **Archive:** `dev-docs/archive/m5/m5-prd0068-undo-redo-dimension-sync.md`
- **ADR:** `dev-docs/archive/m5/2026-06-07-m5-prd0068-undo-redo-dimension-sync-adr.md`

### m5 — prd0065 — close/quit workspace
- **What:** Added `closeWorkspace()` store action that resets all state to blank (entities, relations, canvas, undo/redo, folderName, contentCache, module-level `_adapter`/`_hydrated`). "Close Workspace" button in sidebar footer, visible only when a folder is open, with `SignOut` icon. Also fixed `sortOrder` comparison across 7 call sites — replaced `localeCompare` (locale-aware, sorts "Zz" after "a0") with raw Unicode code-point comparison (sorts "Zz" before "a0", matching fractional-indexing-jittered conventions).
- **Why:** No way to close a workspace and reload fresh data from `graph.json` without clearing IndexedDB manually. The `localeCompare` bug caused all sortOrder-dependent features (including PRD 0064's Stack Children) to sort mixed-case fractional-indexing keys incorrectly.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Added `closeWorkspace()` action
  - `src/canvas/panels/AppSidebar.tsx`: Added "Close Workspace" button gated by `folderName`
  - `src/engine/queries.ts`: Added `compareSortOrder()` utility using `<`/`>` comparison
  - `src/engine/layout.ts`: `stackChildren` sort uses `compareSortOrder`
  - `src/canvas/GraphCanvas.tsx`: Context menu handler sort uses `compareSortOrder`
  - `src/store/useGraphStore.ts`: Two sort calls use `compareSortOrder`
  - `src/engine/queries.ts`: Two sort calls use `compareSortOrder`
  - `src/components/entity-form/EntityForm.tsx`: Sort uses `compareSortOrder`
  - `src/store/workspace.test.ts`: New — 5 tests for `closeWorkspace`
- **Impact:** User can close workspace and re-open to get fresh data. All sortOrder-based sorting is now consistent across the codebase.
- **Archive:** `dev-docs/archive/m5/m5-prd0065-close-quit-workspace.md`
- **ADR:** `dev-docs/archive/m5/2026-06-07-m5-prd0065-close-workspace-adr.md`, `dev-docs/archive/m5/2026-06-07-compare-sortorder-adr.md`

---



### m5 — prd0063 — segment node auto-height
- **What:** SegmentCard component (fixed-width, auto-expanding content block), `autoHeight` feature flag (default off), EntityNode autoHeight mode (hides top/bottom resize handles, content-determined height via block layout, DOM height measurement to `canvasData.height` with >1px guard, textarea auto-expand), and `layout.ts` now prefers `canvasData.height` over deprecated `estimateNodeHeight()`. Fixed `container-type: size` CSS containment in `index.css` by adding `[data-auto-height]` override with `inline-size`.
- **Why:** Segments need natural height based on content rather than fixed manual resize. Auto-height and manual resize coexist under a feature flag. Measured heights feed dagre layout (PRD 0064 depends on this).
- **Files changed:**
  - `src/components/SegmentCard.tsx`: New — fixed-width, auto-expanding content wrapper
  - `src/components/SegmentCard.test.tsx`: New — rendering tests (width, children, className/style)
  - `src/canvas/nodes/EntityNode.tsx`: SegmentCard integration, gated resize handles, DOM measurement effect, textarea auto-expand, conditional flex/block layout
  - `src/canvas/nodes/EntityNode.test.ts`: New — measurement guard logic and store integration tests
  - `src/store/useGraphStore.ts`: Added `autoHeight: false` to feature flags
  - `src/engine/layout.ts`: Prefers `canvasData.height`, marked `estimateNodeHeight` @deprecated
  - `src/components/base-node.tsx`: Added `ref` forwarding
  - `src/index.css`: Added `.entity-card[data-auto-height] { container-type: inline-size }` override
  - `src/stories/SegmentCard.stories.tsx`: New — 4 stories (ShortContent, LongContent, EmptyContent, CustomWidth)
  - `src/stories/EntityNode.stories.tsx`: Added `AutoHeightEnabled` story with store beforeEach
  - `package.json`: Added `@testing-library/react` dev dependency
- **Impact:** Auto-height is opt-in per feature flag. Existing resize behavior unchanged. Container sizing (PRD 0064 sub-dagre) can now read accurate child heights from `canvasData`.
- **ADR:** `dev-docs/archive/m5/2026-06-03-prd0063-segment-auto-height-adr.md`
- **Archive:** `dev-docs/archive/m5/m5-prd0063-segment-auto-height.md`

### m5 — prd0062 — hide `contains` edges on canvas
- **What:** `contains`-type relations now drive `parentId` on React Flow nodes for nesting but no longer render as visible edge lines. Filter added in three edge-building sites: non-dagre initial builder (`GraphCanvas.tsx`), non-dagre sync `useEffect` (`GraphCanvas.tsx`), and `getLayoutedElements` (`layout.ts`). Store data unchanged — query functions (`getContainerChildren`, `getParentId`) unaffected.
- **Why:** `contains` relations express structural nesting, not visible connections. Drawing them as edges creates visual clutter and misrepresents the containment hierarchy.
- **ADR:** `m5-prd0062-hide-contains-edges` — no architectural changes
- **Files changed:**
  - `src/canvas/GraphCanvas.tsx`: Filter `contains` edges in non-dagre initial builder and sync useEffect edge builder
  - `src/engine/layout.ts`: Filter `contains` edges in `getLayoutedElements` edge builder

### m5 — prd0060 — reintroduce dagre auto-layout with controllable options
- **What:** Re-enabled dagre behind `autoLayout` feature flag with three isolated pieces: `estimateNodeHeight()` stopgap, reactive dagre sync (respects saved positions), and `runFullLayout()` one-shot button action (ignores saved positions, batch-writes → undoable). New "Canvas Layout" sidebar section with rankdir/nodesep/ranksep/nodeWidth controls and Run Layout button. Default rankdir TB (top-to-bottom) for book/thread reading order. Sibling segments under same parent share max width.
- **Why:** Layout was hardcoded off since Container Group Nodes PRD (0045). The i2 threaded-view vision needs dagre arranging nodes in ordered sequences with user control over spacing.
- **Key decisions:** Three isolated pieces approach avoids coupling between the stopgap, reactive sync, and one-shot action. `runFullLayout` writes via batch (single undo). `fitViewRef` pattern bridges ReactFlowProvider boundary. Default TB matches reading order.
- **ADR:** `m5-prd0060-reintroducing-dagre-to-canvas`
- **Files changed:**
  - `src/engine/layout.ts`: Added `estimateNodeHeight()`, `LayoutOptions`, `ignoreSavedPositions`, `runFullLayout()`, sibling max-width logic, `DEFAULT_LAYOUT_OPTIONS`
  - `src/canvas/GraphCanvas.tsx`: `fitViewRef`, `onRunLayout` callback, updated dagre call sites
  - `src/canvas/panels/sections/CanvasLayoutSection.tsx`: New — presenter with form controls
  - `src/canvas/panels/sections/CanvasLayoutSectionContainer.tsx`: New — container with local options state
  - `src/canvas/panels/AppSidebar.tsx`: Mounts Canvas Layout section gated by `autoLayout`
  - `src/stories/CanvasLayoutSection.stories.tsx`: 4 stories (Default, ChangeDirection, AdjustSpacing, RunLayout)
  - `src/stories/AppSidebar.stories.tsx`: Updated with `onRunLayout` mock
  - `vitest.config.ts`: Added `@dagrejs/dagre` to `optimizeDeps.include`

### m5 — prd0061 — parentId deprecation (single source of parentage via contains edges)
- **What:** Removed `parentId` from the Entity data model. All parentage is now expressed solely through `contains` edges, with `parentId` derived at the React Flow boundary via `getParentId()` query. Migration script (`scripts/migrate-remove-parentId.ts`) handles existing data: creates missing `contains` edges with sequential sort keys, promotes non-container parents to `container`, strips stale `parentId` fields. Three geography leaf nodes (`city--stratford-upon-avon`, `place--kronborg-castle`, `city--athens`) promoted to `container`. Tech Stack group hierarchy fixed (concept-7→vite is now a child of concept-1, with a `contains` edge from concept-1 to concept-7).
- **Reason:** `parentId` and `contains` edges were redundant sources of parent-child information, causing data drift in practice. `contains` edges are the canonical representation — `parentId` is a cached duplicate with no ordering information. Removing it simplifies the data model and eliminates branching in every entity-processing loop.
- **Files changed:**
  - `src/types/graph.ts`: Removed `parentId?: string` from `Entity`
  - `src/engine/queries.ts`: Added `getParentId`, `getChildIds`, `hasChildren`; rewrote `getNestingDepth` and `wouldCreateCycle` to walk `contains` edges
  - `src/store/useGraphStore.ts`: `addEntity` converts `parentId` param to `contains` edge; `updateEntity` no longer writes `parentId`; `deleteEntity` cascade uses `contains` edges
  - `src/canvas/GraphCanvas.tsx`: All node-build sites derive `parentId` from `getParentId`; `onNodeDragStop` creates/removes `contains` edges
  - `src/engine/layout.ts`: Sibling-width grouping and node builder derive parentage from relations
  - `src/routes/VizTest1.tsx`: "child" badge derives from relations
  - `src/canvas/panels/sections/SelectionMetadataSection.tsx`: parent display uses `getParentId()` from store
  - `src/store/nesting.test.ts`: All tests rewritten for `contains` edges
  - `src/engine/queries.test.ts`: New tests for `getParentId`, `getChildIds`, `hasChildren`
  - `scripts/migrate-remove-parentId.ts`: New — one-time migration script
- **Impact:** Single source of truth for nesting. React Flow derives `parentId` at the boundary. Drag-to-nest, detach, and cascade delete all use `contains` edges. Migration script handles existing data with sequential sort keys and container promotion.
- **Archive:** `dev-docs/archive/m5/m5-prd0061-parent-id-deprecation.md`
- **ADR:** `dev-docs/archive/m5/2026-06-03-prd0061-parent-id-deprecation-adr.md`

## 2026-06-02

### m5 — prd0059 — entity form (create mode)
- **What:** Route-agnostic entity creation form with composable section components. 7 new files: `EntityTypeField` (combobox), `ContentField` (textarea), `RelationEditor` (single relation row with type/target comboboxes + conditional position picker), `RelationsSection` (list manager), `MetadataFields` (segment-specific `lineNumber`/`character`), `EntityForm` (composition + submit), `EntityFormDialog` (dialog wrapper). Mounted in VizTest1.tsx header and GraphCanvas.tsx top-right panel. 2 Storybook story files.
- **Reason:** First UI consumer of sort order store actions (PRD 0057). Enables entity creation without requiring the React Flow canvas — works from any route. Architecture prioritizes section-level composability so new fields can be added without rewriting the form.
- **Files changed:**
  - `src/components/entity-form/EntityTypeField.tsx`: New — entity type combobox
  - `src/components/entity-form/ContentField.tsx`: New — content textarea
  - `src/components/entity-form/RelationEditor.tsx`: New — single relation row
  - `src/components/entity-form/RelationsSection.tsx`: New — manages relation rows
  - `src/components/entity-form/MetadataFields.tsx`: New — conditional metadata
  - `src/components/entity-form/EntityForm.tsx`: New — full form composition
  - `src/components/entity-form/EntityFormDialog.tsx`: New — dialog wrapper
  - `src/routes/VizTest1.tsx`: Mount EntityFormDialog trigger in header
  - `src/canvas/GraphCanvas.tsx`: Mount EntityFormDialog trigger in top-right panel
  - `src/stories/EntityForm.stories.tsx`: New — EntityForm stories
  - `src/stories/RelationsSection.stories.tsx`: New — RelationsSection stories
- **Impact:** Entity creation available from both routes. Sort order integration via `appendChild`/`insertChild`. No `parentId` set on `addEntity` (parentId field being deprecated).
- **Archive:** `dev-docs/archive/m5/m5-prd0059-entity-form-create-mode.md`
- **ADR:** `dev-docs/archive/m5/2026-06-02-prd0059-entity-form-create-mode-adr.md`

## 2026-06-01

### m5 — prd0058 — segment metadata conventions
- **What:** Added "Graph & Object Shapes" section to `architecture.md` referencing `domain.ts` and `graph.ts` as source of truth, with `metadata.lineNumber` and `metadata.character` conventions documented. Added linking doc comment in `domain.ts` pointing to the architecture doc.
- **Reason:** `lineNumber` and `character` metadata fields were already used in practice (Hamlet import) but had no documented conventions — only a draft PRD file. Codified them in the project's documentation layer.
- **Files changed:**
  - `dev-docs/architecture.md`: New "Graph & Object Shapes" section with metadata conventions
  - `src/types/domain.ts`: Linking doc comment → architecture.md
- **Impact:** Single source of truth for metadata field semantics. No type-system enforcement (deferred).
- **Archive:** `dev-docs/archive/m5/m5-prd0058-segment-metadata-conventions.md`
- **ADR:** `dev-docs/archive/m5/2026-06-01-prd0058-segment-metadata-conventions-adr.md`

### m5 — prd0057 — sort order & fractional indexing
- **What:** Swapped `fractional-indexing` for `fractional-indexing-jittered` (collision-resistant keys). Added `appendChild`, `insertChild`, `moveChild`, `backfillContainerOrder` store actions as the canonical interface for sort order management. Documented sort order conventions in `domain.ts` — append, insert, move, delete (no reindex), batch import rules. Removed `backfillAllOrders` (scope creep — unnecessary since `backfillContainerOrder` can be called in a loop).
- **Reason:** Sort order existed as a schema field but had no documented rules or store-level API. Jittered keys prevent collisions from concurrent edits. Reverse-architected conventions so all renderers (canvas, threaded view) share the same ordering logic.
- **Files changed:**
  - `package.json`: `fractional-indexing` → `fractional-indexing-jittered`
  - `src/store/useGraphStore.ts`: Added 4 sort-order actions, removed `backfillAllOrders`
  - `src/types/domain.ts`: Documented sort order convention (5 rules, API reference)
- **Impact:** Sort order is now a first-class, documented capability. All future renderers call the same store actions. Dependency adds jitter for safe concurrent inserts. No migration code needed — sort order is assigned at relation creation time.
- **Archive:** `dev-docs/archive/m5/m5-prd0057-sort-order-fractional-indexing.md`
- **ADR:** `dev-docs/archive/m5/2026-06-01-prd0057-sort-order-fractional-indexing-adr.md`

## 2026-05-28

### m5 — prd0051 — experimental section, CollapsibleSection component, ViewLogger and MiniMap toggles
- **What:** Extracted shared `CollapsibleSection` component with rotating caret, renamed "Feature Flags" to "Experimental" and moved it to the bottom of the sidebar. Added ViewLogger display (live x/y/zoom in the top-right button group) and MiniMap, both toggleable via switches in the Experimental section. Set `:root { font-size: 16px }` to match Storybook. Reduced Switch label from `text-sm` to `text-xs` to match section labels.
- **Reason:** The collapsible section pattern was duplicated across three sections — extracting a shared component reduces boilerplate and ensures consistent caret behavior. ViewLogger and MiniMap toggles give users control over canvas chrome. Font-size reset fixes a mismatch where browser defaults (18px) caused rem-based text to render larger than Storybook.
- **Files changed:**
  - `src/index.css`: added `:root { font-size: 16px }` reset
  - `src/components/ui/switch.tsx`: label changed from `text-sm` to `text-xs`
  - `src/canvas/panels/sections/CollapsibleSection.tsx`: new — shared collapsible section component
  - `src/canvas/panels/sections/FeatureFlagsSection.tsx`: refactored to use CollapsibleSection, renamed "Experimental", added viewLogger/minimap labels
  - `src/canvas/panels/sections/BackupsSection.tsx`: refactored to use CollapsibleSection
  - `src/canvas/panels/sections/WorkspaceInfoSection.tsx`: refactored to use CollapsibleSection
  - `src/canvas/panels/ViewLogger.tsx`: new — viewport display (x, y, zoom)
  - `src/canvas/GraphCanvas.tsx`: conditional rendering of ViewLogger and MiniMap, added ViewLogger to button group
  - `src/canvas/panels/AppSidebar.tsx`: moved Experimental section to last position
  - `src/store/useGraphStore.ts`: added `viewLogger` and `minimap` to `DEFAULT_FEATURE_FLAGS`
- **Impact:** Three sections dropped ~15 lines of boilerplate each. Caret rotation is centralized. ViewLogger and MiniMap are now user-toggleable. Font rendering is consistent between Storybook and the app.
- **Archive:** `dev-docs/archive/m5/m5-prd0051-experimental-section.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0051-experimental-section-adr.md`

### m5 — prd0052 — canvas header, undo/redo relocation, disabled button fix
- **What:** Sidebar header now reads `folderName` from the store (falls back to "Workspace"). Undo/Redo buttons moved from WorkspaceInfoSection to the top-right canvas controls panel (between ViewLogger and ZoomControls). Disabled buttons use solid muted text/border instead of `opacity-50` — canvas background no longer shows through disabled buttons. Removed viewport coordinates from WorkspaceInfoSection (ViewLogger in the top-right panel replaces it). Updated WorkspaceInfoSection stories.
- **Reason:** The sidebar header should reflect the current folder name when available. Undo/Redo in the sidebar is hidden when collapsed — moving them to the canvas panel makes them always accessible. `disabled:opacity-50` on buttons caused the canvas background to bleed through, creating visual noise.
- **Files changed:**
  - `src/canvas/panels/AppSidebar.tsx`: read `folderName` from store, dynamic header with fallback to "Workspace"
  - `src/canvas/panels/sections/WorkspaceInfoSection.tsx`: removed undo/redo props, viewport display, and button group
  - `src/canvas/panels/sections/WorkspaceInfoSectionContainer.tsx`: removed undo/redo and viewport store reads
  - `src/canvas/GraphCanvas.tsx`: added undo/redo buttons to top-right panel between ViewLogger and ZoomControls
  - `src/components/ui/button.tsx`: replaced `disabled:opacity-50` with `disabled:text-muted-foreground/40 disabled:border-muted-foreground/20`
  - `src/stories/WorkspaceInfoSection.stories.tsx`: updated to match new props (no undo/redo, no viewport)
- **Impact:** Header now shows the active folder. Undo/Redo always visible in the canvas panel. Disabled buttons are solid — no background bleed-through.
- **Archive:** `dev-docs/archive/m5/m5-prd0052-canvas-header-and-undo-redo.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0052-canvas-header-and-undo-redo-adr.md`

### m5 — prd0049 — project-wide button components (IconButton + ZoomControls)
- **What:** Created `IconButton` (wraps Button, locks `size="icon"` to 32px) and `ZoomControls` (IconButton + ButtonGroup for zoom in/out/fit/1:1). Refactored `SidebarTrigger` to use IconButton. Verified ButtonGroup works with IconButton children.
- **Reason:** Button sizes were inconsistent across the project — every icon button needed explicit sizing. A project-level IconButton enforces 32px consistently.
- **Files changed:**
  - `src/components/ui/icon-button.tsx`: new — wraps Button, locks `size="icon"`
  - `src/canvas/panels/ZoomControls.tsx`: new — ZoomControls with IconButton + ButtonGroup
  - `src/components/ui/sidebar.tsx`: SidebarTrigger uses IconButton with `variant="outline"`
  - `src/canvas/GraphCanvas.tsx`: uses ZoomControls, removes inline zoom buttons
- **Impact:** All icon buttons are consistent 32px. Future button groups use the same pattern.
- **Archive:** `dev-docs/archive/m5/m5-prd0049-button-components.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0049-button-components-adr.md`

### m5 — prd0047 — workspace sidebar (replaces WorkspaceMenu)
- **What:** Replaced the `WorkspaceMenu` popover with a persistent right-side floating sidebar using shadcn `Sidebar` primitives. Three collapsible sections: Feature Flags (with `dragToNest` toggle), Backups (checkpoint save, manual backup list with restore/delete, auto-snapshot prompts), and Workspace Info (folder name, entity count, undo/redo, viewport). SidebarToggle replaces DotsThreeOutline icon. State persisted via shadcn cookie mechanism. Feature flags persisted to localStorage.
- **Reason:** The popover-based WorkspaceMenu closed on click-outside, making it unusable while interacting with the canvas. A persistent sidebar stays open during pan, zoom, select, and edit operations.
- **Files changed:**
  - `src/canvas/panels/AppSidebar.tsx`: new — sidebar container
  - `src/canvas/panels/sections/FeatureFlagsSection.tsx`: new — feature flag toggles
  - `src/canvas/panels/sections/BackupsSection.tsx`: new — backup controls (migrated from WorkspaceMenu)
  - `src/canvas/panels/sections/WorkspaceInfoSection.tsx`: new — workspace info
  - `src/canvas/GraphCanvas.tsx`: add SidebarProvider + AppSidebar + SidebarTrigger, remove WorkspaceMenu
  - `src/canvas/panels/WorkspaceMenu.tsx`: removed
  - `src/store/useGraphStore.ts`: added `featureFlags` slice with localStorage persistence
  - `src/components/ui/sidebar.tsx`: SidebarTrigger component
- **Impact:** Sidebar stays open during canvas interactions. Sections are context-independent (no React Flow dependency) and reusable in other routes. Feature flags persisted across sessions.
- **Archive:** `dev-docs/archive/m5/m5-prd0047-workspace-sidebar.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0047-workspace-sidebar-adr.md`

### m5 — prd0055 — shared node hooks (useResizePersistence + useNodeEdit)
- **What:** Extracted two duplicated patterns from `EntityNode` and `ContainerGroupNode` into shared hooks. `useResizePersistence` persists node resize to the store with 16px grid snapping. `useNodeEdit` manages the inline editing state machine (enter/commit/cancel/escape/auto-focus). Both nodes now use both hooks — removes ~30 lines of duplicated inline editing code from each. Container resize now persists to the store on drag end (was previously only visual).
- **Reason:** Container resize didn't persist because `ContainerGroupNode` had no `onResizeEnd` handler (unlike `EntityNode`). The duplicated inline editing state machine in both nodes was ~25 lines each with nearly identical logic. Shared hooks prevent this class of bug from recurring — any future custom node just calls the hook instead of reimplementing resize persistence.
- **Files changed:**
  - `src/canvas/hooks/useResizePersistence.ts`: new — shared resize-to-store hook
  - `src/canvas/hooks/useNodeEdit.ts`: new — shared inline edit state machine
  - `src/canvas/nodes/EntityNode.tsx`: uses both hooks, -27 lines
  - `src/canvas/nodes/ContainerGroupNode.tsx`: uses both hooks, adds `onResizeEnd` to Right and Bottom; fixes resize persistence bug
- **Impact:** Container resize now persists across reloads (-27 lines per node). Shared hooks establish a pattern for future custom nodes. Resize-and-reload test passes.
- **Archive:** `dev-docs/archive/m5/m5-prd0055-node-hooks.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0055-node-hooks-adr.md`

### m5 — prd0056 — auto-select on creation, context menu position fix
- **What:** Newly created nodes/containers are now automatically selected and enter inline edit mode. Context menu "Add Child Node" and "Add Child Container" use the right-click position (converted to relative flow coordinates) instead of hardcoded offsets. Fixed three bugs: `useNodeEdit` `lastTriggerRef` initialized to `0` instead of `data.editTrigger` (prevented edit-on-creation), `pendingNodeRef` consumption moved outside `setNodes` callback (survives Strict Mode double-fire), selection uses `storeApi.addSelectedNodes` instead of setting `selected: true` on the node object (React Flow v12 API requirement).
- **Reason:** New nodes should be immediately editable without an extra click. Hardcoded positions in the context menu caused children to always appear at the same position regardless of where the user right-clicked.
- **Files changed:**
  - `src/canvas/GraphCanvas.tsx`: context menu position fix, auto-select via `storeApi.addSelectedNodes`, `pendingNodeRef` captured before `setNodes` callback
  - `src/canvas/hooks/useNodeEdit.ts`: `lastTriggerRef` initialized to `0`
  - `src/store/useGraphStore.ts`: added `selectedNodeId` and `setSelectedNode`
- **Impact:** New nodes are selected, editable, and positioned at the click location.
- **Archive:** `dev-docs/archive/m5/m5-prd0056-create-auto-select.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0056-create-auto-select-adr.md`

### m5 — prd0054 — metadata section in sidebar (Node Properties)
- **What:** New "Node Properties" collapsible section in the right sidebar showing all fields of the selected node. Groups: Identity (editable `id` with Refresh Edges button, editable `type` via Select dropdown, `parentId` read-only), Timestamps (`createdAt`, `updatedAt` formatted dates), Canvas (editable `x`, `y`, `width`, `height` with grid snap on blur), and Metadata (dynamic key-value editor with add/remove/save). Section uses ghost inputs (borderless, border on hover/focus). Added `selectedNodeId` to the Zustand store with `useOnSelectionChange` hook to track the selected entity across React Flow render cycles.
- **Reason:** Previously the only way to inspect node properties was via the MetadataNode canvas panel (toggled from context menu). An always-visible sidebar section gives faster access to all entity fields.
- **Files changed:**
  - `src/canvas/panels/sections/SelectionMetadataSection.tsx`: new — property grid presenter with GhostInput, Select for type, metadata editor
  - `src/canvas/panels/sections/SelectionMetadataSectionContainer.tsx`: new — reads `selectedNodeId` from Zustand store
  - `src/canvas/panels/AppSidebar.tsx`: imports SelectionMetadataSectionContainer as first section
  - `src/canvas/GraphCanvas.tsx`: added `useOnSelectionChange` hook to sync selection to store
  - `src/store/useGraphStore.ts`: added `selectedNodeId` + `setSelectedNode`
- **Impact:** Node properties visible in sidebar on click. Type and canvas position are editable inline.
- **Archive:** `dev-docs/archive/m5/m5-prd0054-metadata-in-sidebar.md`
- **ADR:** `dev-docs/archive/m5/2026-05-28-prd0054-metadata-in-sidebar-adr.md`

## 2026-05-27

### m5 — prd0050 — switch component with label, description, invalid state
- **What:** Replaced the bare `<Switch>` toggle with a full labeled component. The new `<Switch>` accepts `label` (required), `description` (optional), `disabled`, and `invalid` props. Uses `<label htmlFor>` so clicking the label text toggles the switch. Invalid state shows a red border on the switch and red description text. Four stories: Default, WithDescription, Disabled, Invalid. FeatureFlagsSection updated to use the new API.
- **Reason:** The bare switch required callers to write the label layout themselves. A self-contained labeled switch reduces duplication and ensures consistent layout across the codebase (label left, switch right, optional description below label).
- **Files changed:**
  - `src/components/ui/switch.tsx`: full rewrite — added label/description/invalid props, `<label>` wrapper with `useId()`
  - `src/stories/Switch.stories.tsx`: new — 4 stories with JSDoc + argTypes descriptions
  - `src/canvas/panels/sections/FeatureFlagsSection.tsx`: simplified to use new Switch API
  - `.storybook/preview.tsx`: added Switch to storySort order
- **Impact:** All future toggle settings use a single consistent pattern. Invalid state patterns established for form components.
- **Archive:** `dev-docs/archive/m5/m5-prd0050-switch-component.md`
- **ADR:** `dev-docs/archive/m5/2026-05-27-prd0050-switch-component-adr.md`

### m5 — prd0048 — container/presenter pattern for sidebar sections
- **What:** Extracted Zustand store access from three sidebar sections into container wrappers. Each section file (`FeatureFlagsSection`, `WorkspaceInfoSection`, `BackupsSection`) is now a pure presenter accepting explicit props. New `*Container.tsx` files own store reads, async operations, and dialog state. `AppSidebar` imports containers. Shared `withSidebarSection` decorator added to `.storybook/decorators.tsx`.
- **Reason:** Components with hidden store dependencies are hard to test, storybook, and refactor. Explicit props make dependencies visible, enable isolated rendering, and eliminate state leakage between stories.
- **Files changed:**
  - `src/canvas/panels/sections/FeatureFlagsSection.tsx`: accepts `{ flags, onToggle }` props
  - `src/canvas/panels/sections/FeatureFlagsSectionContainer.tsx`: new, reads store
  - `src/canvas/panels/sections/WorkspaceInfoSection.tsx`: accepts 7 props instead of 1
  - `src/canvas/panels/sections/WorkspaceInfoSectionContainer.tsx`: new, reads store
  - `src/canvas/panels/sections/BackupsSection.tsx`: accepts all state + callbacks as props
  - `src/canvas/panels/sections/BackupsSectionContainer.tsx`: new, owns dialogs + backup ops
  - `src/canvas/panels/AppSidebar.tsx`: imports containers instead of presenters
  - `src/stories/FeatureFlagsSection.stories.tsx`: explicit args, stateful ToggleFlag story
  - `src/stories/WorkspaceInfoSection.stories.tsx`: explicit args
  - `src/stories/BackupsSection.stories.tsx`: explicit args
  - `.storybook/decorators.tsx`: new, shared `withSidebarSection`
- **Impact:** All 7 sidebar/AppSidebar stories pass with explicit controlled props. Container/presenter pattern established as project convention for future migrations.
- **Archive:** `dev-docs/archive/m5/m5-prd0048-container-presenter-pattern.md`
- **ADR:** `dev-docs/archive/m5/2026-05-27-prd0048-container-presenter-pattern-adr.md`

## 2026-05-25

### m5 — prd0046 — nested containers (containers within containers)
- **What:** Extended container nesting support: containers can now be nested inside other containers via drag-to-assign or context menu ("Add Child Container"). Cycle detection (`wouldCreateCycle`) prevents self-nesting and ancestor cycles. No depth limit — arbitrary nesting allowed. Both utilities exported from `queries.ts` with full test coverage. Store's `updateEntity` rejects cycles silently (no phantom undo entries). Depth sort in GraphCanvas fixed from binary child/non-child to recursive ancestor-depth sort, eliminating React Flow "Parent node not found" warnings. 20 new tests (6 cycle-detection, 3 depth, 11 store integration for cascade/undo/redo).
- **Reason:** Threaded Container View (PRD0047) and Contextual Subgraph Loading (PRD0044) require a multi-level container hierarchy. The `parentId` infrastructure from PRD0045 already handles cascade on delete, extent constraint, and undo batching — this PRD extends the same patterns to container nodes.
- **Files changed:**
  - `src/engine/queries.ts`: Added `wouldCreateCycle`, `getNestingDepth` pure functions
  - `src/store/useGraphStore.ts`: Imported helpers, added cycle guard in `updateEntity`
  - `src/canvas/GraphCanvas.tsx`: Drag-to-assign now accepts `containerGroup` nodes; context menu "Add Child Container"; batch description counts containers too; depth-first node sort (recursive parentId chain)
  - `src/store/nesting.test.ts`: 20 new tests — 9 pure function (cycle + depth), 11 store integration (cascade, undo/redo, empty delete)
- **Impact:** Containers nest arbitrarily deep. Cycles are impossible — drag snaps back with no store mutation and no phantom undo entry. Context menu offers both "Add Child Node" (entity) and "Add Child Container". Delete cascade correctly reparents child containers and grandchildren. Undo/redo works for all nesting operations. No more React Flow parent-ordering warnings. No visual depth differentiation (deferred to later design pass).
- **Archive:** `dev-docs/plans/m5-prd0046-nested-containers.md`

### vitest test framework setup
- **What:** Added vitest (v4.1.7) + jsdom as devDependencies, created `vitest.config.ts` mirroring vite config (plugins, `@/` alias, jsdom environment). Updated `requirements.md` and `architecture.md` to document the testing pipeline. Fixed stale `15×15` grid references to `16×16` in architecture docs.
- **Reason:** Provide a unit testing framework for pure functions, store actions, and state transitions — previously absent from the project. Align test infrastructure with AGENTS.md requirements.
- **Files changed:**
  - `package.json`: Added vitest, jsdom devDependencies
  - `vitest.config.ts`: New — vitest config with jsdom env, path alias, passWithNoTests
  - `dev-docs/requirements.md`: Replaced "no test framework" with vitest requirement
  - `dev-docs/architecture.md`: Added vitest to tech stack, build pipeline steps, verification; fixed 15×15→16×16 grid
  - `dev-docs/changelog.md`: This entry
- **Impact:** `npx vitest run` is now part of the pre-commit verification. No tests written yet — framework is ready for use per AGENTS.md guidelines.
- **ADR:** `dev-docs/archive/2026-05-25-vitest-test-framework-adr.md`

### m5 — prd0045 — container group nodes + entity height fix
- **What:** Container group nodes (entities with `type: "container"` render as visual group boxes via React Flow sub-flows). EntityKind→EntityType rename project-wide. Entity node height rewritten — user-controlled via Top/Bottom NodeResizeControl, no auto-expand. 16px grid alignment (`snapGrid [16,16]`, `Math.ceil` snap, all defaults snapped). Container query CSS for padding at tight vs normal heights (4.75px / 6px via `@container (min-height: 56px)`).
- **Reason:** Enable visual grouping of entities by container hierarchy (parent-child as first-class `parentId` on Entity). Fix brittle auto-height textarea — height should be user-controlled, not dictating card size. Eliminate fractional-pixel issues from [15,15] grid.
- **Files changed:**
  - `src/canvas/nodes/ContainerGroupNode.tsx`: New — group node with header, child area, 4 handles, 4-edge resize
  - `src/canvas/nodes/EntityNode.tsx`: Top/Bottom NodeResizeControl, flex-1 textarea, container query classes
  - `src/canvas/GraphCanvas.tsx`: Register containerGroup type, parent-first ordering, drag-to-assign, context menus, nodeStyle helper
  - `src/store/useGraphStore.ts`: parentId on Entity, cascade reparent, snap16 helper, snapCanvasDim
  - `src/types/graph.ts`: EntityType rename, parentId on Entity
  - `src/index.css`: Container group styles, ns-resize cursor, entity-card container and container query
  - `src/components/base-node.tsx`: h-full flex flex-col on base node
  - Multiple files: EntityKind→EntityType rename (17 files total)
- **Impact:** Containers group children visually with React Flow sub-flows. Entity nodes are now fixed-height (user-resized) with grid-snapped dimensions. Badges removed from all nodes. Seed data unchanged (2 containers exist, children can be assigned via drag-drop).
- **Archive:** `dev-docs/archive/i2-view-data-as-threads-and-groups/m5-prd0045-container-group-nodes.md`
- **ADR:** `dev-docs/archive/i2-view-data-as-threads-and-groups/2026-05-25-prd0045-container-group-nodes-adr.md`

## 2026-05-23

### m4 — prd0044 — schema v5: canvas data on entity

### m4 — prd0043 — undo/redo + backups
- **What:** Unified snapshot-based undo/redo system with batch grouping and a workspace backup panel. Snapshot-based history (50 entries in-memory) captures full domain state on every tracked mutation. Batch grouping via `beginBatch`/`endBatch` with depth-counter merges multi-step actions (multi-select delete, Cmd+drag duplicate) into one undo step. Auto-backup persists 10 most recent undo entries to disk on 2s idle pause. Manual backups (FS Access only) store full workspace in `backups/manual/`. UI merged into a Notion-style three-dot menu (`WorkspaceMenu.tsx`) with undo/redo buttons, Open Folder, and backup sections (manual saves + recent snapshots with relative timestamps). Cmd+Z/Cmd+Shift+Z keyboard shortcuts with input focus guard.
- **Reason:** Critical safety gap — users could not recover from accidental deletes, bad edits, or relation changes. Snapshot approach chosen over command pattern because it requires zero per-mutation logic: every new feature is automatically undoable. Backups added as a crash-recovery net and pre-refactor checkpoint.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Added undo/redo stacks, batch depth state, `beginBatch`/`endBatch`, wrapped 7 mutators, auto-save extended with 2s idle guard + auto-backup persist, `getAdapterHandle`, `loadContentDirect`
  - `src/engine/backup.ts`: New — manual and auto backup engine (create/list/delete/restore) using FS Access API
  - `src/canvas/panels/WorkspaceMenu.tsx`: New — three-dot menu with undo/redo, Open Folder, backup sections, confirmation dialogs
  - `src/canvas/GraphCanvas.tsx`: Added keyboard listener, batch wrapping for deletes/duplicates, replaced multi-button Panel with WorkspaceMenu
  - `src/store/persistence/types.ts`: Added `getRootHandle?()` to interface
  - `src/store/persistence/fs-access-adapter.ts`, `indexeddb-adapter.ts`: Implemented `getRootHandle()`
  - `src/types/fs-access.d.ts`: Extended `FileSystemHandle` with `name`/`kind`, added directory methods
  - `src/types/graph.ts`: Added `HistoryEntry`, `AutoBackupEntry` types
- **Impact:** All graph mutations are now undoable via Cmd+Z. Workspace backups survive page reload and workspace switches. Batch grouping makes multi-delete and duplicate actions one undo step. Three-dot menu consolidates workspace controls.
- **Archive:** `dev-docs/archive/m4/m4-prd0043-undo-redo-and-backup.md`
- **ADR:** `dev-docs/archive/m4/2026-05-23-prd0043-undo-redo-and-backup-adr.md`

### m4 — prd0044 — schema v5: canvas data on entity
- **What:** Schema v5 — added `canvasData: { x, y, width?, height? }` to `Entity`. Stripped `positions` and `dimensions` from `CanvasState` (now only `viewport`). Removed `setNodePosition`, `setCanvasPositions`, `replaceCanvasPositions` — all replaced by `updateEntity(id, { canvasData })` wrapped in batch descriptions. Drag-end creates "Move N nodes" undo entry. Resize-end creates "Resize node" undo entry. Auto-measurement uses non-tracked `applyMeasuredDimensions`. v4→v5 migration in `migrateSnapshot`. Backup restore runs through migration for v4 compat.
- **Reason:** Every feature touching positions (undo, restore, save, Cmd+drag) had bugs from the `canvas.positions` reconciliation gap. Industry products (Figma, Obsidian Canvas, Miro) store position as a fundamental node property. Moving position onto the entity eliminates the reconciliation layer entirely — undo snapshots automatically capture positions.
- **Files changed:**
  - `src/types/graph.ts`: Added `CanvasData`, `canvasData` on `Entity`, stripped `CanvasState`, v5, `HistoryEntry.version`
  - `src/store/useGraphStore.ts`: v4→v5 migration, removed position setters, non-tracked `applyMeasuredDimensions`, exported `migrateSnapshot`, `addEntity`/`updateEntity` handle canvasData
  - `src/canvas/GraphCanvas.tsx`: Simplified effect (2 slices instead of 4), position from `entity.canvasData`, drag-end batch, Cmd+drag uses canvasData on `addEntity`, auto-measure calls `applyMeasuredDimensions`
  - `src/canvas/nodes/EntityNode.tsx`: Resize-end calls `beginBatch("Resize node")` + `updateEntity`
  - `src/engine/backup.ts`: Creates v5 snapshots, restore runs through `migrateSnapshot`
  - `src/data/seed.ts`: Entities get `canvasData: { x: 0, y: 0 }`
- **Impact:** Position bugs in undo, restore, Cmd+drag permanently fixed. Every user action is undoable (including drag and resize). GraphCanvas reconciliation complexity reduced. Schema v4 data auto-migrates on load and on backup restore.
- **Archive:** `dev-docs/archive/m4/m4-prd0044-schema-v5-canvas-data-on-entity.md`
- **ADR:** `dev-docs/archive/m4/2026-05-23-prd0044-schema-v5-canvas-data-on-entity-adr.md`

## 2026-05-22

### fix: seed ID collision + folder open position override
- **What:** Two fixes. (1) When seeding a new folder, entities now get timestamp-unique IDs (e.g. `1745270400000-about-this-workspace`) instead of hardcoded `about-workspace` / `editor-playground`, preventing ID collision between seed nodes and user nodes. (2) When opening an existing folder via `init()`, any entity with an ID matching a seed ID that also exists in the current in-memory store gets remapped to a new timestamp-unique ID on load. Relations and content documents are migrated. The remapped graph is saved back to the adapter immediately so subsequent loads don't re-trigger the collision.
- **Reason:** Opening a folder that was previously seeded overwrote user-placed node positions because the seed IDs matched exactly between the two stores. The position-fallback approach was session-only — on page reload, dagre re-laid-out the nodes. The ID-remap is permanent: after one load, the folder's seed nodes get unique IDs and never collide again.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Seed path generates timestamped IDs; load path detects and remaps seed-ID collisions, migrates relations/docs, saves remapped graph back
- **Impact:** Opening a seeded folder no longer overrides existing node positions. First-time seed no longer uses collision-prone hardcoded IDs. Existing folders get auto-migrated on first open.
- **ADR:** `dev-docs/archive/2026-05-22-seed-id-collision-fix-adr.md`

### m4 — prd0041 — node metadata panel
- **What:** Custom `"metadata"` React Flow node type with editable entity fields (content textarea, kind select, metadata key-value table, read-only ID). Toggled per-entity via context menu "Metadata: Hidden" / "Metadata: Visible". Connected to the entity node by a decorative dashed `smoothstep` edge (view-only, not a domain relation). Position persisted in `canvas.positions["metadata:{entityId}"]` with default left-offset. Resize on all 4 edges. Edge-derived metadata: `author` key creates/updates a `contains` relation to an author entity (`src/engine/edge-metadata.ts` with declarative registry).
- **Reason:** Entities had `metadata: Record<string, unknown>` but no UI to edit it. The metadata-as-node approach avoids viewport transform issues of floating cards and gives the user drag/resize for free. Edge-derived metadata makes relations visible as metadata fields.
- **Files changed:**
  - `src/engine/edge-metadata.ts` (new): Registry mapping metadata keys → relation config, `resolveEdgeValue()`, `writeEdgeValue()`, auto-creates connected entities
  - `src/canvas/nodes/MetadataNode.tsx` (new): Custom React Flow node with form fields, 4-edge NodeResizeControl, hidden Handles for edge routing
  - `src/canvas/GraphCanvas.tsx`: Registered `"metadata"` node type; `visibleMetadataNodeIds` state; metadata node injection/removal in layout effect; decorative edge injection/removal with `.metadata-edge` CSS class; context menu toggle; delete cascade cleanup
  - `src/index.css`: `.metadata-edge` rules for dashed muted decorative edges
  - `src/components/ui/select.tsx`, `src/components/ui/label.tsx` (new): shadcn components installed
- **Impact:** Users can now inspect and edit entity metadata directly on the canvas. The `"metadata"` node type establishes the pattern for future view-only nodes (thread headers, group containers). Edge-derived metadata registry extends naturally to more keys.
- **Archive:** `dev-docs/archive/m4/m4-prd0041-node-metadata-panel.md`
- **ADR:** `dev-docs/archive/m4/2026-05-22-prd0041-node-metadata-panel-adr.md`

## 2026-05-18

### m4 — prd0040 — edge inline editing
- **What:** Double-click edge label → inline text input + combobox of existing relation types. Custom `EdgeLabel` edge component renders Bezier path with `EdgeLabelRenderer` for interactive label. Enter/blur commits via `updateRelation`, Escape cancels. Dropdown click immediately selects and commits. Removed EdgeDialog, `onEdgeDoubleClick`, edge context menu "Edit Relation". Added pane double-click guard (`.react-flow__edge-label` / `.react-flow__edge` check) to prevent accidental node creation when interacting with edge labels.
- **Reason:** Inline editing is faster than a modal dialog — same commit pattern as node inline editing. Eliminates unnecessary modal overhead.
- **Files changed:**
  - `src/canvas/edges/EdgeLabel.tsx` (new): Custom edge component with inline editing
  - `src/canvas/GraphCanvas.tsx`: Registered `edgeTypes`; removed EdgeDialog import/state/handlers; removed "Edit Relation" from edge context menu; added pane double-click guard for edges
  - `src/engine/queries.ts`: Added `getRelationTypes()` utility
  - `src/canvas/EdgeDialog.tsx` (deleted): Replaced by inline editing
- **Impact:** Faster edge type editing. No more modal dialog. Edge label clicks don't accidentally create nodes.
- **Archive:** `dev-docs/archive/m4/m4-prd0040-edge-inline-editing.md`
- **ADR:** `dev-docs/archive/m4/2026-05-18-prd0040-edge-inline-editing-adr.md`

### m4 — prd0039 — cmd+drag to duplicate node
- **What:** Cmd+drag on a node clones the entity (kind, content, metadata) with a unique ID and places the copy at the drop position (snapped to 15px grid). Multi-selection Cmd+drag duplicates all selected nodes while preserving relative offsets. Ghost nodes (50% opacity) appear at original positions during drag for visual confirmation — user sees two nodes confirming duplication. Dagre disabled via `__experimentalNoDagre` — node positions come only from the store. `setCanvasPositions` changed from hard-replace to merge (spreads existing positions under new ones) with a `replaceCanvasPositions` variant for deliberate bulk resets. Fallback positions log a `console.warn` when a node has no saved position (canary for position leaks).
- **Reason:** Fast node duplication without leaving the canvas. The ghost UX eliminates the "did it work?" uncertainty on drop. The `setCanvasPositions` merge prevents accidental position data loss (found during development — Cmd+drag handler was dropping all other saved positions). Dagre disabled because it fights user-positioned layouts.
- **Files changed:**
  - `src/canvas/GraphCanvas.tsx`: Added `onNodeDragStart`/`onNodeDragStop` for Cmd+drag detection, ghost node injection, clone creation, original revert; disabled Dagre via `__experimentalNoDagre`; added warning-enhanced fallback positions
  - `src/index.css`: Added `.react-flow__node.ghost-node` styles (50% opacity, no pointer events)
  - `src/store/useGraphStore.ts`: `setCanvasPositions` now merges with existing positions; added `replaceCanvasPositions` for explicit bulk replacement
- **Impact:** Users can Cmd+drag to duplicate any node (or selection). Positions can never be silently dropped by a partial `setCanvasPositions` call. Console warns if any node loads without a saved position.
- **Archive:** `dev-docs/archive/m4/m4-prd0039-cmd-drag-duplicate-node.md`
- **ADR:** `dev-docs/archive/m4/2026-05-18-prd0039-cmd-drag-duplicate-node-adr.md`

### m4 — prd0038 — save node positions
- **What:** Schema v4 with `canvas: { positions, viewport }` on `GraphSnapshot`. Node positions and viewport are now persisted inside the snapshot (replaces localStorage viewport). On load, saved positions override Dagre; Dagre fills in for new entities. On drag end (including multi-select drag), all node positions are saved. Viewport debounce-saves to canvas. Re-layout button gated behind `__experimentalReLayout`. Migration v3→v4 inserts empty canvas.
- **Reason:** Foundation for user-arranged layouts. Positions were ephemeral (lost on reload), making the canvas unreliable for any layout work.
- **Files changed:**
  - `src/types/graph.ts`: Added `CanvasState` type, bumped `GraphSnapshot` to v4 with `canvas` field
  - `src/store/persistence/types.ts`: Updated `WorkspaceSnapshot` to include `canvas`
  - `src/store/useGraphStore.ts`: Added `hydrated` flag, v3→v4 migration, `setNodePosition`/`setCanvasPositions`/`setViewport` actions, auto-save includes canvas and triggers on canvas changes
  - `src/data/seed.ts`: Seed snapshot to v4 with empty canvas
  - `src/canvas/GraphCanvas.tsx`: Positions loaded from store on init; saved on drag end via `getNodes()` (handles multi-select); viewport restored after hydration from `canvas.viewport` (replaces localStorage); fitView called imperatively when no saved viewport
  - `src/components/AppSidebar.tsx`: Snapshot format to v4
- **Impact:** User node arrangements and viewport survive reload. Multi-select drag now persists all moved nodes. Re-layout hidden behind flag. Schema v3 data auto-migrates to v4 on load.
- **Archive:** `dev-docs/archive/m4/m4-prd0038-save-node-positions.md`
- **ADR:** `dev-docs/archive/m4/2026-05-18-prd0038-save-node-positions-adr.md`

### m4 - prd0035 - cursor styles (cursor-styles branch, unmerged)
- **What:** Context-appropriate cursors across the graph canvas. Canvas pane → `default` (`!important` overrides React Flow's `pointer` from `selectionOnDrag`). Node body non-text → `grab`, dragging → `grabbing`. Node text content → `default`, editing → `text`. Edge labels → `default` (was `pointer`). Handles → `grab`. Verified all 7 cursor scenarios.
- **Reason:** The cursor is the first feedback the user gets — matching cursor to expected interaction makes the canvas feel intentional rather than confusing. The pane was showing `pointer` (from `selectionOnDrag`), nodes had no grab affordance, and edge labels falsely signaled clickability.
- **Files changed:**
  - `src/index.css`: Added pane (`default`), node (`grab`/`grabbing`), handle (`grab`) cursors; changed edge-label from `pointer` to `default`
  - `src/canvas/nodes/EntityNode.tsx`: Changed text `<p>` from `cursor-grab` to `cursor-default`
  - `src/components/base-handle.tsx`: Added `cursor-grab` to className
- **Impact:** Canvas cursor behavior now matches user expectations — pane is for selection/context-menu, nodes are grab-draggable, text is read-only until double-clicked.
- **Archive:** `dev-docs/archive/m4/m4-prd0035-cursor-styles.md`

### m4 - prd0035b - pane double-click + node position fix (cursor-styles branch, unmerged)
- **What:** Added pane double-click node creation + fixed layout merge to preserve `editTrigger`. Uses native DOM `dblclick` listener with `{ capture: true }` on the ReactFlow container (React Flow's synthetic `onDoubleClick` never fires — its internal handler calls `stopImmediatePropagation`). `zoomOnDoubleClick={false}` disables zoom. The handler skips double-clicks on nodes via `.closest('.react-flow__node')` check. Refactored `createNodeAtCenter` (button) and the listener into a shared `createNode(position)` helper. **Fixed node positioning**: `createNode` no longer calls `setNodes` immediately (the new node didn't exist in `nds` yet since `addEntity` hadn't triggered a re-render). Instead, it stores position in `pendingNodeRef`. The layout effect's merge catches new nodes in the `else` branch — if `pendingNodeRef` matches, the node enters with cursor position instead of Dagre's, all within the same `setNodes` call. Fixed the layout merge to preserve transient `data` fields (was `{ ...existing, data: layoutedNode.data }`, wiped `editTrigger`).
- **Reason:** The roadmap item required both pane double-click and predictable viewport-center creation. The `editTrigger` bug meant new nodes never auto-opened the editor — they appeared silently at the right position but needed a manual double-click to edit.
- **Files changed:**
  - `src/canvas/GraphCanvas.tsx`: Added native `dblclick` listener with capture phase, `zoomOnDoubleClick={false}` prop, `pendingNodeRef` for deferred position, refactored `createNode` as shared helper, fixed layout merge data spread
  - `dev-docs/plans/i1-graph-canvas/i1-roadmap.md`: Moved double-click item from Now to ✅ Done
- **Impact:** Double-clicking on empty canvas pane creates a node at that exact position with auto-open editor. The "New Node" button now reliably positions at viewport center AND opens the editor too (both were silently broken — `setNodes` in the event handler couldn't find the new node in state yet, so positions and `editTrigger` were always overridden by the layout effect with Dagre defaults). Editor auto-opens for all new node creation paths.
- **ADR:** `dev-docs/archive/m4/m4-prd0036-pane-double-click-position-fix.md`

## 2026-05-17

### m4 - prd0034 - FS Access persistence test
- **What:** Verified the FS Access persistence layer end-to-end after PRD0033 edge-handle changes. Cleaned up `~/Code/hello2/` — replaced stale v2 schema data (corrupted titles, orphaned annotations) with fresh v3 test data: 8 entities (2 seed containers + "Tech Stack" container + 5 tech-stack concepts), 7 relations (5x `contains` + 2x `related_to`), and 3 Tiptap documents. Opened folder in browser via "Open Folder" → all nodes and edges rendered correctly. Created new "Vite" node → auto-save wrote to `~/Code/hello2/graph.json` within 300ms. Inline-edited content from "concept" to "Vite" → auto-save persisted. Reloaded page → FS handle auto-reconnected (`tryReconnect()`) → all data restored including the "Vite" node. Zero console errors. No code changes required.
- **Reason:** The FS Access adapter and auto-save had never been tested with real entities+relations after the edge connection and handle implementations (PRD0028b–PRD0033). The existing `~/Code/hello2/` data was from a v2 schema and had accumulated stale annotations from editor tests, making real persistence verification impossible.
- **Files changed:**
  - `~/Code/hello2/graph.json`: Rewritten — v3 schema, 8 entities, 7 relations
  - `~/Code/hello2/documents/about-workspace.json`: Refreshed seed TipTap content
  - `~/Code/hello2/documents/editor-playground.json`: Refreshed seed TipTap content
  - `~/Code/hello2/documents/tech-stack.json`: **New** — TipTap content for Tech Stack container
  - `dev-docs/plans/m4-prd0034-fs-access-persistence-test.md`: **New** — PRD plan
  - `dev-docs/archive/m4/m4-prd0034-fs-access-persistence-test.md`: Archived PRD with completion note
  - `dev-docs/plans/i1-graph-canvas/i1-roadmap.md`: Moved test item from "now" to "✅ Done"
- **Impact:** Persistence roundtrip confirmed working — load from folder, create/edit entities, auto-save to disk, survive page reload. The FS handle stored in IndexedDB enables seamless reconnection without re-picking the folder. The test folder `~/Code/hello2/` now has clean, meaningful test data that exercises both nodes and edges in the graph canvas.
- **Archive:** `dev-docs/archive/m4/m4-prd0034-fs-access-persistence-test.md`

### m4 - prd0031 - inline node editing
- **What:** Schema migration (dropped `title`, made `content: string` required, v2→v3 snapshot) and inline text editing inside EntityNode. Textarea with `nodrag nowheel nopan`, auto-sizing height, commit on Escape/blur (Enter = newline). Double-click enters edit mode. Context menu "Edit" triggers inline edit via `editTrigger` counter. New nodes open in edit mode immediately. NodeDialog removed (kind changes deferred). Seed data restructured — Tiptap JSON moved to separate `SEED_CONTAINER_CONTENT` map.
- **Reason:** Nodes were static — editing required a separate dialog. The Figma pattern (double-click to edit inline) is faster and more natural. Schema cleanup removes the redundant `title`/`content` duality.
- **Files changed:**
  - `src/types/graph.ts`: Dropped `title?`, made `content: string` required, version → 3
  - `src/store/useGraphStore.ts`: v2→v3 migration (old titles → `metadata.title`), updated `addEntity`/`updateEntity`
  - `src/data/seed.ts`: Tiptap JSON → separate `SEED_CONTAINER_CONTENT` map, entities use `content` for display text
  - `src/engine/ids.ts`: `generateUniqueId` parameter `title` → `content`
  - `src/canvas/nodes/EntityNode.tsx`: Inline editing — idle/editing states, textarea, height mirror, commit logic
  - `src/canvas/GraphCanvas.tsx`: Removed `onNodeDoubleClick`, context menu triggers inline edit, removed NodeDialog
  - `src/canvas/NodeDialog.tsx`: Deleted
  - `src/engine/layout.ts`: `entity.title` → `entity.content`
  - `src/renderers/ReadingViewport.tsx`, `AppSidebar.tsx`, `HomePage.tsx`, `TiptapEditor.tsx`, `PassageLinkPopover.tsx`, `MentionNodeView.tsx`, `queries.ts`: All `entity.title` → `entity.content`/`metadata.title` fallback
- **Impact:** Nodes editable inline — double-click to type, Enter for newline, Escape/blur to commit. Schema is cleaner (one text field). Existing data migrated automatically. Foundation for handles (PRD0032) and resize (PRD0032).
- **Archive:** `dev-docs/archive/m4-prd0031-inline-node-editing.md`

### m4 - prd0033 - four-way handles
- **What:** Replaced 2-handle setup (target left, source right) with 4 handles at every edge (top/right/bottom/left), all `type="source"` — direction captured by source→target in Connection, not handle type. `onConnect` stores `sourceHandle`/`targetHandle` in relation metadata. `isValidConnection` prevents self-connections. Layout engine passes handle IDs from metadata to React Flow `Edge` for correct reconnection on reload.
- **Reason:** Users need to connect any side of any node to any side of any other node — 4 handles make the graph feel responsive and precise rather than forcing connections to fixed left/right positions.
- **Files changed:**
  - `src/canvas/nodes/EntityNode.tsx`: Replaced 2 BaseHandle calls with 4, each with unique `id` (top/right/bottom/left)
  - `src/canvas/GraphCanvas.tsx`: `onConnect` stores handle IDs, added `isValidConnection` (no self-connections)
  - `src/engine/layout.ts`: Passes `sourceHandle`/`targetHandle` from relation metadata to Edge
- **Impact:** Any-to-any edge connections. Self-connections blocked. Handle positions survive grid reload. Foundation for future view data namespacing.
- **Archive:** `dev-docs/archive/m4/m4-prd0033-four-way-handles.md`

### m4 - prd0032 - handles and invisible resize
- **What:** Added BaseHandle (left target, right source) and invisible NodeResizer to EntityNode. Handles are 14px dots with 2px border, themed via React Flow CSS variables — zero `!important` except on resize cursor rules (inline React Flow override). `::before` pseudo-element expands handle hit area to ~18px. Resize is cursor-only: 2px edge lines expanded to 8px via `::before` for full edge activation, corners covered by overlapping edge strips. Top/bottom resize removed after prototyping (node height governed by textarea). Min size 60×45.
- **Reason:** Nodes had no connection handles and no resize capability. Handles enable edge creation. Resize lets users adjust node width for readable text display. Cursor-only resize keeps the visual clean (no visible resize dots).
- **Files changed:**
  - `src/components/base-handle.tsx`: **New** — installed from reactflow.dev shadcn registry
  - `src/canvas/nodes/EntityNode.tsx`: Added BaseHandle + NodeResizer imports and render
  - `src/index.css`: Handle hit-area expansion (`::before`), resize cursor rules (edge lines + corners), handle theming via CSS variables + specificity
- **Impact:** Nodes have edge connection handles. Nodes are resizable by dragging edges. Handle hit areas are generous (~18px). Resize activation covers full edge (~8px from border). Foundation for PRD0033 (4-way handles) and future resize dot visibility.
- **Archive:** `dev-docs/archive/m4/m4-prd0032-handles-and-resize.md`

### m4 - prd0030 - test and ui refinement — BaseNode custom entity node
- **What:** Implemented a custom entity node using React Flow's BaseNode shadcn-style component. Installed `base-node` (BaseNode, BaseNodeHeader, BaseNodeHeaderTitle, BaseNodeContent, BaseNodeFooter) from reactflow.dev UI registry and `badge` from standard shadcn registry. Created `EntityNode.tsx` composing BaseNode + Badge (shows entity kind). Registered `nodeTypes` at module scope in GraphCanvas. Changed layout engine from `type: "default"` to `type: "entity"`. Removed manual `.react-flow__node.selected` CSS since BaseNode handles selection internally.
- **Reason:** All nodes were using React Flow's built-in `"default"` type — unstyled gray rectangles. BaseNode provides a shared, shadcn-compatible node layout (header/content/footer) that makes the graph look polished and extendable.
- **Files changed:**
  - `src/components/base-node.tsx`: **New** — BaseNode, BaseNodeHeader, BaseNodeHeaderTitle, BaseNodeContent, BaseNodeFooter from reactflow.dev registry
  - `src/components/ui/badge.tsx`: **New** — Badge component from shadcn standard registry
  - `src/canvas/nodes/EntityNode.tsx`: **New** — custom entity node composing BaseNode family + Badge
  - `src/engine/layout.ts`: Changed `type: "default"` → `type: "entity"`
  - `src/canvas/GraphCanvas.tsx`: Added `EntityNode` import + `nodeTypes` registration, passed `nodeTypes` prop to ReactFlow
  - `src/index.css`: Removed `.react-flow__node.selected` outline rule
- **Impact:** All entities now render with a styled card layout (header with title, content with kind badge). Foundation for future custom node variants and connection handles.
- **Archive:** `dev-docs/archive/m4-prd0030-test-and-ui-refinement.md`

## 2026-05-16

### m4 - i1 - p6 - edge editing labels context menus - prd0028b
- * Added `updateRelation` to store. Created `EdgeDialog.tsx` (Base UI Dialog for relation type + sortOrder). Created `GraphContextMenu.tsx` (manually-positioned menu, no Radix trigger-wrapper conflicts). Wired `onEdgeDoubleClick`, `onNodeContextMenu`, `onEdgeContextMenu`, `onPaneContextMenu` in GraphCanvas. Added CSS override (`.react-flow__edge-label`) for always-visible edge labels.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Added `updateRelation` action
  - `src/canvas/EdgeDialog.tsx`: **New** — edit relation type + sortOrder dialog
  - `src/canvas/GraphContextMenu.tsx`: **New** — manual positioned context menu
  - `src/canvas/GraphCanvas.tsx`: Wired edge editing, context menu events, dialog renders
  - `src/index.css`: Added edge label CSS override
- **Archive:** `dev-docs/archive/m4-prd0028b-edge-editing-context-menus.md`

### m4 - i1 - p7 - data migration and ui cleanup
- * Added version 1→2 migration in `useGraphStore.init()` — pads missing `createdAt`/`updatedAt` on entities, `sortOrder` on relations when loading old data. Removed sidebar and topbar from WorkspaceRoot — now a full-height canvas with only Panel buttons (New Node, Open Folder, Re-layout). Moved "Open Folder" button from AppSidebar into GraphCanvas Panel. Updated `dev-docs/architecture.md` module map, `AGENTS.md` key paths, `reminders.md` with React Flow/Base UI gotchas.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Added `migrateSnapshot()`, called on workspace load
  - `src/canvas/GraphCanvas.tsx`: Added onOpenFolder handler, Open Folder button in Panel
  - `src/routes/WorkspaceRoot.tsx`: Stripped SidebarProvider/AppSidebar/SidebarInset — just GraphCanvas in full-height div
  - `dev-docs/architecture.md`: Updated module map, added Graph Canvas section, added store action docs
  - `AGENTS.md`: Updated Key Paths, App.tsx description
  - `dev-docs/reminders.md`: Added React Flow, Base UI, FS Access, migration gotchas
  - `dev-docs/plans/m4-prd0029-data-migration.md`: **New** — small PRD

## 2026-05-15

### m3 - p2 - cross-document passage linking - quote type - prd0022
- * inline popover (mention pattern) to link passages across documents
- * "quote" relation type links two passage anchors
- * gutter indicator (24x24 chain-link icon) for each passage, click to open popover
- * underline decoration at 75% opacity on passage text
- * human-readable labels stored on annotation entities at creation time
- * added `"quote"` to `RelationType` in graph.ts. `addRelation` now accepts optional `metadata`. Store reconciliation extracts and stores `metadata.label` (truncated anchored text).
- * PassageAnchor gains a ProseMirror `decorations` plugin that renders 24x24 gutter buttons. Click dispatches a custom `passage-link-click` event → inline popover opens with existing links, link-to-more, and comment field. PassageLinkDialog replaced by PassageLinkPopover (floating card, same pattern as mention popup). Popover positions 24px right+down from gutter button, flips left if it overflows viewport.
- **Files changed:**
  - `src/components/tiptap/PassageAnchor.ts`: Added ProseMirror decorations plugin for gutter widget buttons, relocated transformPasted into a proper Plugin
  - `src/components/tiptap/PassageLinkDialog.tsx`: Deleted (replaced by PassageLinkPopover)
  - `src/components/tiptap/PassageLinkPopover.tsx`: **New** — inline popover with existing links, document picker, passage picker, comment field. Positions near gutter button, closes on click outside.
  - `src/renderers/TiptapEditor.tsx`: Removed handleClickOn, added custom event listener for gutter button clicks, replaced PassageLinkDialog with PassageLinkPopover, updated CSS for underline decoration
  - `src/renderers/RichTextContent.tsx`: PassageAnchor added to extensions (read-only survival)
  - `src/types/graph.ts`: Added `"quote"` to RelationType
  - `src/store/useGraphStore.ts`: `addRelation` accepts optional `metadata`. Reconciliation stores `metadata.label` (first ~60 chars of anchored text).
- **Archive:** `dev-docs/plans/prd0022-cross-document-passage-linking.md`

### m3 - p1 - relations between nodes - passage anchor marks - prd0021
- * passage anchor marks are custom TipPassageAnchor mark extension (Highlight, swapped color for segmentId)
- * "Create passage" button in BubbleMenu when text is selected. Creates annotation entity with metadata.segmentId + sourceContainer. Subtle gutter indicator on passages with outgoing links.
- **What:** Custom TipTap mark extension `PassageAnchor` that assigns a stable `segmentId` to any selected text range via BubbleMenu button. Marks survive save/load round-trip (same mechanism as Highlight). Annotation entities are created lazily via save-time reconciliation — no orphan entities on undo. `transformPasted` plugin strips marks from pasted content to prevent duplicate entity references. Deleted passages get `metadata.stale: true` instead of destroying the entity (preserves cross-doc comment relations).
- **Files changed:**
  - `src/components/tiptap/PassageAnchor.ts`: **New** — PassageAnchor mark extension (Mark.create, segmentId attr, transformPasted plugin)
  - `src/renderers/TiptapEditor.tsx`: Added PassageAnchor to extensions, added "Create passage" pencel button to BubbleMenu
  - `src/renderers/RichTextContent.tsx`: Added PassageAnchor to extensions array (read-only survival)
  - `src/store/useGraphStore.ts`: Added reconciliation step in saveContent() — walks document marks, creates missing annotation entities, marks stale ones
- **Archive:** `dev-docs/plans/prd0021-passage-anchor-marks.md`

### Pluggable Persistence Adapter Layer (PRD0020)
- **What:** Replaced the localStorage-only persistence with a pluggable `PersistenceAdapter` interface. Two implementations: `IndexedDBAdapter` (default, uses Dexie.js) and `FSAccessAdapter` (optional, Chromium-only). Auto-detection via `resolveAdapter()` — tries FS Access reconnection first, falls back to IndexedDB. Overridable via `VITE_PERSISTENCE_ADAPTER` env var or `?adapter=` URL param. Store `init(adapter)` replaces `loadInitialState()` — adapter is injected at startup. Sidebar shows folder name breadcrumb when FS Access is active and an "Open Folder&hellip;" button when on IndexedDB with `showDirectoryPicker` available. Seed data fallback unchanged.
- **Reason:** localStorage is synchronous, size-limited (~5-10MB), and cannot handle binary assets or transactional safety. The previous FS Access approach (2026-05-14) was a non-starter because it gated the entire app on a Chromium-only API. The adapter pattern solves both problems: IndexedDB is the default (works everywhere, async, larger quota) while FS Access is opt-in (power users who want visible files). The adapter interface makes adding Tauri or remote backends a store-free change.
- **Files changed:**
  - `src/store/persistence/types.ts`: **New** — PersistenceAdapter interface, WorkspaceSnapshot, AdapterType
  - `src/store/persistence/indexeddb-adapter.ts`: **New** — IndexedDB adapter with Dexie.js
  - `src/store/persistence/fs-access-adapter.ts`: **New** — FS Access adapter with handle persistence via IndexedDB
  - `src/store/persistence/resolver.ts`: **New** — Auto-detection, env/URL override, singleton management
  - `src/store/persistence/index.ts`: **New** — Re-exports
  - `src/store/useGraphStore.ts`: Rewritten — `init(adapter)` replaces `loadInitialState()`, adapter-based persistence, content cache, `adapterId`/`folderName`/`refreshFolderName`
  - `src/App.tsx`: Added `resolveAdapter().then(init)` on mount
  - `src/components/AppSidebar.tsx`: Added folder name breadcrumb, "Open Folder&hellip;" button
  - `src/components/ui/breadcrumb.tsx`: **New** — shadcn breadcrumb component
  - `src/types/fs-access.d.ts`: **New** — File System Access API type declarations
  - `package.json`: Added `dexie` dependency
- **Impact:** App persists to IndexedDB by default — no visible change for most users. Chromium users can opt into FS Access via sidebar "Open Folder&hellip;". Adapter switching is testable via URL param. The adapter interface is ready for Tauri packaging (Phase 4). Seed data flow unchanged.
- **ADR:** `archive/2026-05-15-persistence-adapter-layer.md`

### Live Mention NodeView (PRD0019)
- **What:** Replaced TipTap's default Mention node (which renders static `attrs.label`) with a custom React NodeView that resolves the live entity title from the graph store via `attrs.id`. Created `MentionNodeView.tsx` with a `CustomMention` extension (`Mention.extend({ addNodeView() })`) that renders `@{label}` reactively and supports click-to-navigate (plain click in read-only, Cmd/Ctrl-click in editable mode). Added `CustomMention` to `RichTextContent.tsx` so mention nodes render in read-only mode instead of being stripped by ProseMirror.
- **Reason:** Renaming an entity left stale mention labels in all documents. `attrs.label` is a snapshot, but `attrs.id` is a permanent reference — the NodeView uses it to query the store for the current title, falling back to `attrs.label` if the entity is deleted.
- **Files changed:**
  - `src/components/tiptap/MentionNodeView.tsx`: **New** — React NodeView component (`MentionNodeView`) + `CustomMention` extension wiring (`Mention.extend({ addNodeView() })`)
  - `src/renderers/TiptapEditor.tsx`: Replaced `Mention` import with `CustomMention`
  - `src/renderers/RichTextContent.tsx`: Added `CustomMention` to extensions array so mentions render in read-only mode
- **Impact:** Mentions now show the current entity title everywhere — editable editor and read-only SegmentCards. Navigation click works in read-only mode (opens new tab). Cmd/Ctrl-click navigates from editable mode. Deleted entities show the original label as fallback. JSON round-trip unchanged (`attrs.id` + `attrs.label` still preserved).
- **Archive:** `archive/2026-05-15-prd0019-live-mention-nodeview.md`

### Fix: drag handle appearance
- **What:** Fixed the drag handle sizing, alignment, and transition smoothness. Replaced the 12x12 hand-rolled SVG dots with `DotsSixVertical` from `@phosphor-icons/react` (16px, bold weight). Resized the drag handle container to 24x24 — aligned with text line height. Switched from conditional rendering (`{showDragHandle && ...}`) to always-rendered with opacity/pointer-events controlled via inline styles, adding a 200ms ease-in-out CSS transition so the handle fades smoothly instead of snapping in/out of the DOM on scroll.
- **Reason:** The handle was too small (12px icon in a 16px container), misaligned with the text baseline, and its sudden appearance (entering/leaving the DOM) made it "follow the user around" distractingly during scroll.
- **Files changed:**
  - `src/renderers/TiptapEditor.tsx`: Imported `DotsSixVertical` from `@phosphor-icons/react`, replaced SVG with icon component, changed conditional rendering to style-controlled opacity
  - `src/components/tiptap-templates/simple/simple-editor.scss`: Added `.drag-handle` class with 24x24 sizing, centering, color variables, border-radius, `user-select: none`, and `transition: opacity 200ms ease-in-out`

### Mention suggestion popup (PRD0018)
- **What:** Replaced the stub suggestion renderer in `TiptapEditor.tsx` with a proper React-based popup using shadcn's Command component
- **Reason:** The stub showed static "Loading..." text with no items, no keyboard nav, no click handling. Needed for cross-doc `@` mentions.
- **Files changed:**
  - `src/components/tiptap/MentionPopup.tsx`: **New** — React component wrapping shadcn Command with keyboard nav, mouse hover selection, empty state
  - `src/components/tiptap/mentionSuggestionRenderer.tsx`: **New** — factory bridging TipTap's suggestion plugin lifecycle to React via `createRoot`
  - `src/renderers/TiptapEditor.tsx`: Replaced inline `render: () => {...}` stub with `render: mentionSuggestionRenderer`
  - `src/components/ui/command.tsx`: Added via `npx shadcn@latest add command` (plus dialog, input-group, textarea subdeps)
- **Impact:** `@` now shows a styled popup with live filtering, keyboard navigation (up/down/enter/esc), click selection, and proper cursor positioning. No scaffolding left for Phase 3.3.
- **Archive:** `archive/2026-05-15-prd0018-mention-suggestion-popup.md`

### Fix: content loading race + cleanup effect saving to wrong entity
- **What:** Two bugs: (1) Content loaded via `useEffect` + `useState` caused a flash of empty editor on every page open, then `setDocContent` would trigger a re-render where TipTap's `setContent()` sometimes applied and sometimes didn't. (2) The cleanup `useEffect` used `onSaveRef.current` which is updated on every render — when navigating from entity A to entity B, the cleanup ran AFTER React had updated `onSaveRef.current` to entity B's callback, causing entity A's content to be saved under entity B's ID in the content store.
- **Fix:**
  - ReadingViewport: switched from `useEffect` + `useState` to `useMemo` for content loading — content is synchronous during render, no flash, no race.
  - TiptapEditor: added `mountOnSaveRef`/`mountOnTitleChangeRef` — captured at mount time and never updated. The cleanup effect uses these mount-time refs instead of the live refs, so it always saves to the correct entity regardless of re-render order.
- **Impact:** No more empty editors on page load. No more content corruption when navigating between pages (which was causing duplicate "Editor Playground" entries in the sidebar). Fresh `localStorage.clear()` recommended for users with corrupted content store.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: `useEffect`/`useState` → `useMemo` for content. Removed `useState`/`useEffect` imports.
  - `src/renderers/TiptapEditor.tsx`: Added `mountOnSaveRef`/`mountOnTitleChangeRef` for clean cleanup. Cleanup now uses mount-time refs.
  - `src/store/useGraphStore.ts`: Removed `set()` call from `getContent` (was causing unnecessary re-renders during a read function).

### localStorage persistence replaces File System Access API
- **What:** Replaced the File System Access API (`showDirectoryPicker` + `graph.json` read/write) with `localStorage`. Removed `FolderPicker` gate, `openFolder()`/`restoreFolder()` actions, `directoryHandle`/`folderName`/`saveStatus` store fields, `persistence.ts` (IndexedDB handle helpers), and `config.ts` (feature flags). Added `src/data/seed.ts` with two Tiptap containers ("About This Workspace" and "Editor Playground") that load on first visit. Auto-save writes to localStorage key `react-roadmap:graph` with the same 300ms debounce pattern. Cleaned up HomePage footer and AppSidebar (removed folder name and save status UI).
- **Reason:** The File System Access API only works in Chromium browsers, making the app non-functional in Firefox, Safari, and mobile — and completely broken when deployed as a static SPA. The folder picker had recurring stability issues that were consuming debugging time. The immediate priority is testing core features (Tiptap editing, navigation) without fighting storage infrastructure.
- **Files changed:**
  - `src/data/seed.ts`: Created — two containers with Tiptap ProseMirror content
  - `src/store/useGraphStore.ts`: Rewritten — removed FS API, added localStorage init + auto-save, seed fallback
  - `src/App.tsx`: Removed FolderPicker, removed restoreFolder/directoryHandle branching, simplified
  - `src/components/HomePage.tsx`: Removed folderName/saveStatus/footer save-dot
  - `src/components/AppSidebar.tsx`: Removed folderName footer display
  - `src/persistence.ts`: Deleted (no longer needed)
  - `src/config.ts`: Deleted (no longer needed)
  - `vite.config.js`: Removed `hello2/graph.json` watch ignore
  - `AGENTS.md`: Updated Key Paths and seed data description
  - `dev-docs/architecture.md`: Updated Store/Output/Feature-Flag sections, module map
  - `dev-docs/changelog.md`: Added this entry
  - `dev-docs/roadmap.md`: Added to Recently Completed
- **Note:** Superseded by PRD0020 (pluggable persistence adapter layer) later the same day.

### Content separation — graph vs document store (PRD0018)
- **What:** Separated graph metadata from document content. Removed `content` from the container entity path — container bodies now live in separate localStorage keys (`react-roadmap:content:{id}`). Added `getContent(id)`, `saveContent(id, data)`, `clearContent(id)` to the store. Container IDs use timestamp-based `generateDocId()` (`doc_{timestamp}`) instead of slugified titles, so multiple "Untitled" pages have unique stable IDs. ReadingViewport loads container content from the content store on focus. Segment entities retain their `content` field for hamlet legacy.
- **Reason:** Storing stringified TipTap JSON in `Entity.content` bloated `graph.json`, made the graph unqueryable without parsing every document body, and violated separation of concerns. The graph should answer "what documents exist and how are they connected" — document bodies are a separate concern.
- **Files changed:**
  - `src/engine/ids.ts`: Added `generateDocId()` for timestamp-based container IDs. Root-level containers now use `doc_{timestamp}` instead of `slugify("Untitled")`.
  - `src/store/useGraphStore.ts`: Added `contentLoaded`, `getContent`, `saveContent`, `clearContent`. Container content is no longer stored on the entity. `updateEntity` strips `content` for containers.
  - `src/renderers/ReadingViewport.tsx`: Empty containers load content from `getContent()` instead of `entity.content`. Save goes through `saveContent()`.
  - `dev-docs/archive/2026-05-15-content-separation.md`: Created ADR.
  - `dev-docs/plans/prd0018-content-separation.md`: Created and promoted to archive.
  - `dev-docs/architecture.md`: Updated domain model, store, and persistence documentation.
  - `dev-docs/roadmap.md`: Added to Recently Completed.
- **ADR:** `archive/2026-05-15-content-separation.md`
- **Archive:** `archive/2026-05-15-prd0018-content-separation.md`

### Sidebar home navigation — PRD0015
- **What:** Stripped React Flow from the app entirely. Replaced the floating popover sidebar with a permanent shadcn `Sidebar` containing Home link, page list, and "New page" button. Created a `HomePage` view showing root containers as clickable cards with save status. Page creation is now one-click from sidebar or home page. Removed `CanvasView`, `assignLayout`, `toReactFlowNodes`, `toReactFlowEdges`. Layout changed from conditional canvas/viewport to `SidebarProvider + AppSidebar + SidebarInset + HomePage/ReadingViewport`.
- **Reason:** The dual-mode app (canvas vs. reading viewport) was fragile — changes to one path destabilized the other. React Flow was a distraction while the core reading + editing experience still needs validation. The popover sidebar was a two-click detour for the most common action (page navigation).
- **Files changed:**
  - `src/App.tsx`: Removed React Flow imports/CSS, `CanvasView`, `assignLayout`, `toReactFlowNodes`, `toReactFlowEdges`, `SidebarPopover`, `?view=graph` URL branch. New layout: `SidebarProvider → AppSidebar + SidebarInset → HomePage or ReadingViewport`.
  - `src/components/AppSidebar.tsx`: Created — permanent shadcn sidebar with Home link, root container list, "New page" button, folder name footer.
  - `src/components/HomePage.tsx`: Created — root container cards, new page CTA, save status bar.
  - `dev-docs/roadmap.md`: Moved canvas items to Later, added PRD0015 to Recently Completed, reordered Now/Next/Later.
  - `dev-docs/architecture.md`: Updated module map (removed canvas adapters, added AppSidebar/HomePage).
- **Impact:** App is now the reading workspace. No canvas mode-switching. Sidebar is always visible. Page creation and selection are single-click. React Flow dependency remains in package.json but is no longer imported/bundled — ready for Phase 5 reintroduction.
- **Archive:** `archive/2026-05-15-prd0015-sidebar-home-navigation.md`

### TipTap UI Phase 1: Simple Editor scaffold — PRD0014
- **What:** Scaffolded TipTap's Simple Editor template (MIT) for the Playground editing experience. Created `TiptapEditor` wrapper with full toolbar (formatting, headings, lists, alignment, blockquote, code, link, image upload, undo/redo). Implemented debounced save strategy (onBlur + 1.5s idle + onUnmount) to prevent ProseMirror/Zustand transaction collisions that caused blank-screen crashes on complex operations. Empty containers now render full-width editor with no duplicate content and no empty sidebar.
- **Reason:** The bare contenteditable editing experience had no toolbar or formatting controls. The `onUpdate`-driven Zustand sync caused crashes on complex ProseMirror operations (blockquote toggle) due to synchronous state updates during transaction cycles.
- **Files changed:**
  - `src/renderers/TiptapEditor.tsx`: Created — full editor wrapper with toolbar, debounced save
  - `src/renderers/ReadingViewport.tsx`: Empty containers get full-width editor (no sidebar, no duplicate SegmentCard)
  - `package.json`: Added `sass`
  - `src/index.css`: Added TipTap UI SCSS imports
  - 144 TipTap UI component files scaffolded by CLI
- **Impact:** Full editing experience on Playground with toolbar. Blockquote and other complex operations no longer crash. Content auto-saves on blur, after 1.5s idle, and on unmount. Hamlet layout unchanged. Phase 1 complete — ready for BubbleMenu, Drag Handle, and additional extensions.
- **Archive:** `archive/2026-05-15-prd0014-tiptap-ui-p1.md`

### TipTap UI Phase 2: Free Notion-like delta — PRD0016
- **What:** Added BubbleMenu (floating toolbar on text selection), Drag Handle (block drag-and-drop), Placeholder extension, and Emoji autocomplete to the editor. All features are free/MIT, no paid subscription.
- **Reason:** Phase 1 delivered the toolbar; Phase 2 adds the hallmark block editor interactions (floating menu, drag reorder) that make the editor feel modern.
- **Files changed:**
  - `package.json`: Added `@tiptap/extension-placeholder`, `@tiptap/extension-emoji`, `@tiptap/extension-drag-handle-react`, `@tiptap/extension-drag-handle`, `@tiptap/extension-node-range`
  - `src/renderers/TiptapEditor.tsx`: Added BubbleMenu, DragHandle, Placeholder, Emoji
- **Impact:** Full block-editing experience on Playground. Drag handle needs polish (alignment/sizing). Emoji is basic (`:code:` only). Slash commands deferred — pending research on open-source alternatives.
- **Archive:** `archive/2026-05-15-prd0016-tiptap-ui-p2.md`

### TipTap + page navigation — PRD0013
- **What:** Integrated TipTap into the reading viewport as the content renderer, replacing `dangerouslySetInnerHTML`. Created `RichTextContent` component supporting both read-only and editable modes. Added three root containers (`playground`, `books`, `roadmap`) to `hello2/graph.json`. Added `view` param to URL sync (`?view=page|graph`). Fixed URL restore race condition where React 19 strict mode double-effects caused the second `restoreFolder()` call to overwrite the focused entity. Relaxed container content model — containers can now hold content directly (Playground is an editable page). Created TipTap–graph mapping test plan for ProseMirror JSON vs HTML exploration.
- **Reason:** The reading viewport rendered content via raw `dangerouslySetInnerHTML` with no rich text model. TipTap was the chosen editor and needed integration before annotation creation and inline editing. URL navigation needed `view` param for mode switching. The container content guard blocked the Playground editing test.
- **Files changed:**
  - `src/renderers/RichTextContent.tsx`: Created — TipTap-based content renderer (read-only + editable, onUpdate support)
  - `src/renderers/ReadingViewport.tsx`: Replaced `ContentHtml` with `RichTextContent`. Added editable content area for empty containers. Removed `dangerouslySetInnerHTML`.
  - `src/store/useGraphStore.ts`: Removed `if (kind === "container") delete final.content` guard. Added `requestPermission` in `openFolder()`. Removed `view` reset in `restoreFolder()` (fixes URL restore race).
  - `src/App.tsx`: Added `view` param to URL sync and restore logic.
  - `hello2/graph.json`: Added `playground`, `books`, `roadmap` root containers. Added `books → hamlet` contains relation.
  - `dev-docs/roadmap.md`: Updated Now section with TipTap plan.
  - `dev-docs/archive/2026-05-14-tiptap-page-navigation.md`: Created — PRD0013 plan.
  - `dev-docs/plans/prd0013-tiptap-graph-mapping.md`: Created — test plan for ProseMirror JSON vs HTML and per-entity vs per-container document models.
- **Impact:** Content renders through TipTap with proper ProseMirror model. `dangerouslySetInnerHTML` eliminated. Empty containers (Playground, Roadmap) are editable pages. URL navigation includes view mode. Three root containers provide navigation entry points. URL restore works reliably. Foundation for editable TipTap, annotation creation, and ProseMirror JSON exploration.
- **ADR:** `archive/2026-05-15-tiptap-graph-mapping-test-plan.md` (test plan — conclusions reached, Model A + JSON confirmed)
- **Archive:** `archive/2026-05-14-tiptap-page-navigation.md`

---

## 2026-05-14

### Popover sidebar navigation — M2 Phase 1 (PRD0012)
- **What:** Replaced the AppHeader with a floating three-dots button (MoreHorizontal) that opens a popover containing a shadcn Sidebar with root-level entity navigation. The sidebar lists root containers (works, roadmaps, note collections) as flat menu items. The ReadingViewport header (X + breadcrumb) was removed — titles display inline as card content. Added `getRootContainers` to the query engine.
- **Reason:** The header was a relic of the canvas-centric design. Removing it gives a cleaner, card-based reading experience. The popover sidebar provides immediate graph navigation without a persistent sidebar that changes the main layout.
- **Files changed:**
  - `src/App.tsx`: Removed AppHeader component. Added SidebarPopover inline component using shadcn Popover + Sidebar primitives. Layout is now content-only with a floating dots button.
  - `src/renderers/ReadingViewport.tsx`: Removed `<header>` with X button and breadcrumb. Removed unused `getContainerBreadcrumb` and `resolveContainer` imports.
  - `src/engine/queries.ts`: Added `getRootContainers` — returns entities with kind "container" and no incoming "contains" relation.
  - `src/components/ui/popover.tsx`: Installed (shadcn Base UI popover)
  - `src/components/ui/sidebar.tsx` + 6 supporting files: Installed (shadcn Base UI sidebar)
- **Impact:** No header bar — content fills the full viewport. Three-dots button floats in the top-right corner. Opening it shows root containers for navigation. ReadingViewport content scrolls edge-to-edge with card-based rendering. Canvas View access moved into the sidebar popover. Foundation for home page (root container listing) and mode switcher.
- **Archive:** `archive/2026-05-14-sidebar-navigation.md`

### Fix: SidebarProvider wrapping + layout conflict
- **What:** Two bugs in the initial sidebar implementation: (1) `useSidebar()` threw because no `SidebarProvider` ancestor existed; (2) `SidebarProvider`'s flex layout (`flex min-h-svh w-full`) broke React Flow's parent container sizing. Fixed by importing `SidebarProvider` and wrapping the App return with `className="contents"` to provide context without layout interference.
- **Reason:** The initial implementation followed the plan's pattern code which omitted `SidebarProvider` — the plan only showed `Popover → Sidebar` without the required provider context. The second bug was a conflict between shadcn's sidebar layout and React Flow's sizing contract.
- **Files changed:**
  - `src/App.tsx`: Imported `SidebarProvider`, wrapped `App` return, added `className="contents"` to prevent flex layout from breaking React Flow's parent container
- **Impact:** Sidebar opens without errors. React Flow canvas renders at full viewport height. The fix pattern (`SidebarProvider className="contents"`) should be used for any future sidebar-in-popover or sidebar-in-overlay patterns.
- **ADR:** `archive/2026-05-14-sidebar-navigation.md`

### Minimal Entity Model — PRD0010-1
- **What:** Implemented the core entity model rules and ID scheme. Created `src/engine/ids.ts` with `slugify`, `generateEntityId`, and collision handling. Wired into store: `addEntity` auto-generates semantic IDs (e.g. `parent_seg-0001`), enforces no-title-on-segments and no-content-on-containers. `updateEntity` propagrates ID changes through all relations. Added HTML content rendering in the reading viewport.
- **Reason:** The entity model rules were validated against the 1,359-entity Hamlet restructuring. The ID scheme makes graph.json self-documenting — an ID like `hamlet_act-01_scene-01_seg-0001` tells you the entity's place in the graph. The model rules prevent data inconsistencies at creation time.
- **Files changed:**
  - `src/engine/ids.ts`: Created — slugify, generateEntityId, generateUniqueId
  - `src/store/useGraphStore.ts`: Updated addEntity (ID generation, model enforcement), updateEntity (rename propagation), deleteEntity (cascade)
  - `src/renderers/ReadingViewport.tsx`: Added ContentHtml component for HTML content rendering
- **Impact:** New entities automatically get semantic IDs. Segments and containers are structurally consistent. HTML content renders correctly (title page `<h1>`, etc.). M1 milestone complete.
- **Archive:** `archive/2026-05-14-prd0010-1-minimal-entity-model.md`

### Fix: skip auto-save on initial disk load, flip PERSIST_HANDLE default to true
- **What:** Two fixes: (1) the auto-save subscription now checks `_hydrated` flag and skips writes during initial store population from disk — prevents Vite HMR loop when `graph.json` is inside the project root; (2) `PERSIST_HANDLE` default flipped to `true` (opt-out via `VITE_PERSIST_HANDLE=false`).
- **Reason:** Opening a folder inside the Vite project root caused the initial auto-save write-back to trigger a full page reload, creating an infinite loop. Handle persistence was opt-in but the user expects it to just work.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Added `_hydrated` module-level flag, set to `true` after `openFolder()` and `restoreFolder()` population, checked in auto-save subscription
  - `src/config.ts`: Changed `=== "true"` to `!== "false"` — default is now `true`
  - `dev-docs/architecture.md`: Updated feature flag description
  - `dev-docs/roadmap.md`: Updated Recently Completed
- **Impact:** No more reload loop. Handle persistence works out of the box.

### Handle Persistence & URL-Based Navigation — PRD0011
- **What:** Two coordinated changes: (1) feature-flagged folder handle persistence via IndexedDB so users don't re-pick their folder every session, (2) URL-based view state sync so page reloads restore the reading viewport position. When `VITE_PERSIST_HANDLE=true`, the `FileSystemDirectoryHandle` is stored in IndexedDB and silently restored on startup — the folder picker is skipped entirely. The view state (`focusedEntityId`, `anchorEntityId`) is synced to URL search params via `history.replaceState` (debounced 200ms), and restored after folder resolution on load. Stale entity IDs in URLs gracefully fall back to the canvas view.
- **Reason:** Editing `graph.json` externally caused page reloads that lost the user's place. Re-picking the folder every session was friction that broke flow. The URL is a natural bookmarkable anchor for the reading viewport.
- **Files changed:**
  - `src/config.ts`: Created — feature flag `PERSIST_HANDLE` from `VITE_PERSIST_HANDLE` env var
  - `src/persistence.ts`: Created — IndexedDB helpers (`saveHandle`, `loadHandle`, `clearHandle`)
  - `src/store/useGraphStore.ts`: Added `restoreFolder()` action, persist handle after `openFolder()` when flag is on, global type augmentation for `FileSystemHandle.requestPermission`
  - `src/App.tsx`: Added three effects — handle restore on mount, URL param restoration after folder resolve, URL sync on view state change
  - `dev-docs/requirements.md`: Updated persistence requirements
  - `dev-docs/architecture.md`: Added store actions, feature flag section, module map entries
  - `dev-docs/roadmap.md`: Updated Recently Completed
- **Impact:** Users with `VITE_PERSIST_HANDLE=true` see zero friction on reload — folder reconnects, view restores. Users with the flag off see no change. URL is now a bookmarkable entry point to any entity. No new dependencies.
- **ADR:** `archive/2026-05-14-handle-persistence-and-url-navigation.md`
- **Archive:** `archive/2026-05-14-prd0011-handle-persistence-and-url-navigation.md`

### File System Persistence — PRD0009
- **What:** Replaced localStorage with the File System Access API. The user picks a folder at startup — the app reads/writes `graph.json` inside it. No seed data, no localStorage, no hidden state. App shows a folder picker gate on launch, renders folder name + save status in a header bar. Removed `hamlet.json` bundle import (cut JS bundle from 968 KB to 425 KB).
- **Reason:** localStorage is opaque to users and agents, has no permanence across machines, and contradicts the product goal of making data transparent and portable. The user's graph should be a file they can see, edit, version, and share.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Rewritten — removed `seedEntities`, `seedRelations`, `hamletData` import, `loadInitialState()`, `persistToDisk()`, `exportGraph()`, `importGraph()`, localStorage auto-save. Added `directoryHandle`, `folderName`, `saveStatus`, `openFolder()` action, FS API auto-save subscription.
  - `src/App.tsx`: Added `FolderPicker` gate (unsupported browser message + open folder button), `AppHeader` (folder name + save status dot), canvas height fix (`100vh` → `100%`).
- **Impact:** App no longer works without a user-picked folder. Data is a plain JSON file the user owns. 425 KB JS bundle (was 968 KB with bundled hamlet.json). Clear localStorage before using.
- **Archive:** `archive/2026-05-14-prd0009-file-system-persistence.md`

### Pure Domain Loader — PRD0008
- **What:** Stripped all runtime merging, source detection, and content matching from `loadInitialState()`. It is now a straight three-step cascade: try localStorage → try hamlet.json → fall back to seed data → return as-is. No post-processing. Each data source is self-contained (all relation targets exist within the same source).
- **Reason:** The loader was making assumptions about the data (checking for `seg_18`/`seg_1614` to guess the source, merging annotation entities from one source into another). This was the same class of bug that caused the content-matching failure — the domain model should be unquestionable. What's in the file is what you get.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Removed annotation entity merging loop, source detection check, and annotation relation merging block (lines 129–159). `loadInitialState()` now returns the selected source directly.
- **Impact:** Zero runtime assumptions about data integrity. If a source has dangling relation targets, queries return empty results (harmless). The store is simpler and easier to reason about.
- **Archive:** `archive/2026-05-14-prd0008-pure-domain-loader.md`

### Fix annotation seed data — embed directly in hamlet.json
- **What:** Replaced the fragile content-matching approach (which tried to match segments by text normalization at runtime) with direct embedding of 5 annotation entities (`note_1`–`note_4`, `ref_1`) and 5 relations (`r_6`–`r_10`) in `src/data/hamlet.json`. The relations now target actual hamlet segment IDs (`seg_18` for "Who's there?", `seg_1614` for "To be, or not to be"). The store's `loadInitialState()` was cleaned up — removed the broken content-matching code, and the annotation merging now correctly sources relations from hamlet.json when hamlet data is detected (presence of `seg_18`/`seg_1614`), falling back to seed relations for the seed data path.
- **Reason:** The content-matching approach was broken — the `norm()` regex only handled straight apostrophes but the hamlet JSON uses curly quotes (U+2019), so "Who's there?" never matched its segment. Only the "To be" segment worked because its search term has no apostrophes. Additionally, the approach was fragile (depended on text normalization) and added relations with wrong source IDs (`hamlet_1`/`hamlet_2` don't exist in hamlet JSON) when loaded from localStorage.
- **Files changed:**
  - `src/data/hamlet.json`: Added 5 annotation entities and 5 annotates/references relations directly into the JSON
  - `src/store/useGraphStore.ts`: Removed content-matching block; annotation merging now detects hamlet data and sources relations from the embedded hamlet.json data; falls back to seed relations for non-hamlet data
- **Impact:** Annotation indicators now appear on both "Who's there?" (seg_18) and "To be, or not to be" (seg_1614) in the reading viewport. Users with existing localStorage should clear it (DevTools > Application > Local Storage) to pick up the fresh hamlet.json annotations. The approach is now data-driven rather than algorithm-driven, which is more reliable.

---

## 2026-05-13

### Persistence layer — PRD0003
- **What:** Added localStorage auto-save with debounce, startup hydration, and manual export/import of entities and relations. Domain state survives page refresh for the first time.
- **Reason:** The graph store was entirely in-memory — any work was lost on refresh. Persistence is a prerequisite for the reading workspace (M2) where users need to keep annotations and notes across sessions.
- **Files changed:**
  - `src/types/graph.ts`: Added `GraphSnapshot` type
  - `src/store/useGraphStore.ts`: Added `loadInitialState()` hydration, debounced auto-save subscription, `exportGraph` (JSON download), `importGraph` (replace state)
- **Impact:** State persists automatically. Manual export/import enables backups and sharing. Foundation for future SQLite storage (PRD0003 out of scope: no schema migrations, no settings UI).
- **Archive:** `archive/2026-05-13-prd0003-persistence-layer.md`

### Continuous scroll viewport — PRD0005
- **What:** Replaced the single-segment reading viewport with a container-aware scrollable view. Containers now render all child segments stacked vertically — acts as large headings, scenes as medium headings, character speeches with labels, stage directions in italic. Breadcrumb navigation shows the container path. Canvas clicks resolve to the parent container so users enter the reading viewport at the work level, not the segment level. Added `getContainerChildren`, `resolveContainer`, and `getContainerBreadcrumb` to the query engine.
- **Reason:** The segment-by-segment prev/next model destroyed reading flow for long-form text. The UX vision requires continuous vertical scrolling as the primary reading axis, with segments as the content *of* a work, not separate pages.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Rewrote — SegmentCard variants for act/scene/character/stage-direction/annotation, breadcrumb header, prev/next within container children
  - `src/engine/queries.ts`: Added `getContainerChildren` (ordered child chain resolution), `resolveContainer` (walk up contains to find parent), `getContainerBreadcrumb` (path traversal)
  - `src/App.tsx`: Updated — canvas click resolves to parent container via `resolveContainer`
  - `src/store/useGraphStore.ts`: Updated seed data — added `contains` relations for all hamlet segments under act_1, added `type: "act"` metadata
  - `dev-docs/roadmap.md`: Updated milestones and sprint order
  - `dev-docs/plans/prd0005-hamlet-import.md` → `prd0006-hamlet-import.md`: Renumbered
- **Impact:** Reading viewport now works like a book — scroll through the full text. Container resolution means clicking any node on the canvas opens its work context. Foundation laid for side-panel expansion and multi-column reading.
- **Archive:** `archive/2026-05-13-prd0005-continuous-scroll-viewport.md`

### Full text import — PRD0006
- **What:** Built a Gutenberg HTML parser for Hamlet (`scripts/import-gutenberg.ts`) that produces 1342 entities and 2634 relations across 5 acts, 20 scenes, 40 characters. The snapshot is bundled into the app and loads on first run (empty localStorage). Added `npm run import:hamlet` command.
- **Reason:** The continuous scroll viewport needed real content at scale. The full play validates reading navigation, localStorage persistence, and canvas rendering with ~1,300 entities.
- **Files changed:**
  - `scripts/import-gutenberg.ts`: Created — DOM-based Gutenberg HTML parser with character extraction, scene/act detection, continuation merging
  - `src/data/hamlet.json`: Generated — bundled Hamlet snapshot (1342 entities, 2634 relations)
  - `src/store/useGraphStore.ts`: Updated — first run loads full Hamlet from bundled snapshot
  - `package.json`: Added `import:hamlet` script
- **Impact:** Demo-ready — clicking "Act I" on the canvas shows the full play as a scrollable text. Next step: side-panel contextual expansion for annotations and references.
- **Archive:** `archive/2026-05-13-prd0006-hamlet-import.md`

### Contextual expansion — PRD0007
- **What:** Added relation indicators (`ChatCircleText` for annotations, `Link` for references) in the right gutter of segments with outgoing relations. Clicking an indicator reveals an annotation card below the segment with the linked content. Cards use a bordered card style with relation type label, entity title, content, and × close button. Seed data enriched with 2 new annotations and 1 reference. `focusEntity` resets expanded panels on navigation.
- **Reason:** The horizontal axis of the vision (contextual expansion) was completely missing — readers could see no relations and had no way to view linked content. This is the first step toward the Notion-style/Talmudic inline annotation model.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Added AnnotationCard component, indicator icon in right gutter of SegmentCard, toggle via expandedPanels
  - `src/store/useGraphStore.ts`: Enriched seed data (note_3, note_4, ref_1 + relations); focusEntity resets expandedPanels
- **Impact:** Reading viewport now shows relation indicators. Clicking reveals annotations inline. Foundation for "Talmud mode" (show all) and annotation creation.

### Work entity + full-play scrolling
- **What:** Added `hamlet--william-shakespeare` work entity that contains the entire play — Dramatis Personæ, all 5 acts, Transcriber's Notes — as one scrollable view. `resolveContainer` walks to the root work, so clicking any node shows the full play with that section in context. Canvas shows the work node alongside its children.
- **Files changed:**
  - `scripts/import-gutenberg.ts`: Added work entity creation, Dramatis Personæ parsing, Transcriber's Notes capture, full content boundary iteration
  - `src/data/hamlet.json`: Regenerated (1346 entities, 2664 relations, 8 work children)
  - `src/renderers/ReadingViewport.tsx`: Added SegmentCard variant for `type: "work"` (title heading)
- **Impact:** Scroll the entire play top-to-bottom from the title page through all acts to the notes. Clear localStorage (DevTools > Application) to reload fresh data.

### Reading viewport + shadcn/ui — PRD0004
- **What:** Built the first real renderer — a focused reading viewport that displays entity content with prev/next navigation. Added Tailwind v4 and shadcn/ui (Base UI) as the component foundation. Canvas now supports click-to-focus mode switching.
- **Reason:** The canvas adapter bridge was temporary — the product validates on a clean reading experience. shadcn/ui provides high-quality accessible components without obscuring custom styles, laying a scalable design foundation.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Created — focused entity display with prev/next/back navigation
  - `src/App.tsx`: Updated — mode-switch rendering (canvas vs viewport), onNodeClick wiring
  - `src/index.css`: Replaced Vite template styles with full shadcn/Tailwind theme, cleaned up conflicts
  - `index.html`: Added dark mode class toggle script
  - `vite.config.js`: Added tailwindcss plugin, @/ path alias
  - `tsconfig.json`: Added @/ path alias
  - `package.json`: Added tailwindcss, @tailwindcss/vite
  - `src/components/ui/button.tsx`: Created by shadcn init
  - `src/lib/utils.ts`: Created by shadcn init (cn utility)
  - `dev-docs/visual-design.md`: Created — design principles and conventions
- **Impact:** First real renderer replaces the temporary canvas bridge. Component foundation clean and scalable.
- **Archive:** `archive/2026-05-13-prd0004-reading-viewport.md`

### Domain engine refactor — PRD0002
- **What:** Replaced the React-Flow-coupled AppNode/AppEdge types with a pure Entity/Relation domain model. Rewrote the store to hold separate domain state and view state. Created the query engine. Added a canvas adapter bridge to keep React Flow rendering alive during the transition.
- **Reason:** The old architecture treated React Flow nodes as domain entities, mixing viewport state (coordinates, dragging, selection) with the semantic model. The new model decouples state from rendering, enabling the reading workspace (M2) without fighting canvas internals.
- **Files changed:**
  - `src/types/graph.ts`: Rewrote — Entity/Relation/ViewState types, removed AppNode/AppEdge/NodeKind/EdgeKind/EdgeBehavior
  - `src/store/useGraphStore.ts`: Rewrote — entities/relations/view slices, no React Flow imports
  - `src/engine/queries.ts`: Created — getEntity, getRelations, getSequentialContext, getLinkedContext
  - `src/App.tsx`: Updated — canvas adapter bridge transforms domain entities to React Flow nodes
  - `src/App.css`: Deleted (unused Vite template residuals)
  - `dev-docs/requirements.md`: Updated — reflects new type ontology
  - `dev-docs/architecture.md`: Already updated in prior commit
- **Impact:** Domain model is now framework-agnostic. Store is simpler and testable. React Flow canvas still renders the same seed data. Foundation for reading workspace laid.
- **ADR:** `archive/2026-05-13-prd0002-domain-engine-refactor.md`

### Architectural pivot: decouple domain model from React Flow
- **What:** Adopted the architecture review recommendation to restructure the system as Entity Graph → Projection Layer → Renderer. React Flow demoted from core runtime to optional spatial renderer (Phase 4+). Roadmap reordered to validate contextual reading before graph visualization.
- **Reason:** The original plan coupled domain state to canvas coordinates and React Flow internals, which would make reading workspace UX brittle. Decoupling lets us validate the core interaction (contextual reading) without fighting canvas complexity.
- **Files changed:**
  - `dev-docs/roadmap.md`: Full rewrite with 4 new milestones
- **Impact:** The immediate work shifts from building custom graph nodes to refactoring the domain schema and building a reading workspace. React Flow work deferred to Phase 4.

### Typed graph schema and Zustand store
- **What:** Created the typed data layer and global state management for the graph system, replacing the stock Vite template.
- **Reason:** Establish the foundation before building any UI — NodeKind/EdgeKind types, store actions, and a React Flow canvas.
- **Files changed:**
  - `src/types/graph.ts`: Node/Edge TypeScript types with React Flow integration
  - `src/store/useGraphStore.ts`: Zustand store with mutation actions and seed data
  - `src/App.tsx`: React Flow canvas (replaced stock Vite demo template)
  - `src/main.tsx`: Entrypoint (migrated to TypeScript)
  - `tsconfig.json`: Strict TypeScript config
  - `package.json`: Added typescript, zustand
  - `index.html`: Script ref → main.tsx
- **Impact:** Foundation for all future graph features. No visual custom nodes yet.
- **ADR:** N/A — scaffolding, not a design decision requiring an ADR.
