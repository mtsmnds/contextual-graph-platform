# Workflow Log

Record of every command executed by the `dev-workflow` skill.
Append-only, newest on top within same-day groupings.

---

## 2026-06-03

### prd end — m5-prd0061-parent-id-deprecation
- **Source:** user request — "can you run prd end? i already merged but forgot this workflow"
- **Branch at time:** m5-prd0060-reintroducing-dagre-to-canvas (dirty — uncommitted changes from implementation)
- **Change classification:** Architecture change
- **ADR type:** full (schema change: removed parentId from Entity, nesting via contains edges, migration script, container promotion)
- **Pre-commit guard:** auto-proceeded (unexpected branch — user said "already merged")

## 2026-06-02

### prd start — m5-prd0060-reintroducing-dagre-to-canvas (Phase 2)
- **Source:** user text — "prd start"
- **Branch at time:** main (clean)
- **Branch decision:** create from main → m5-prd0060-reintroducing-dagre-to-canvas
- **Scope:** Phase 2 (Canvas Layout section, Run Layout button, three isolated pieces)
- **Changes:**
  - `src/engine/layout.ts`: Added `estimateNodeHeight()` stopgap, `LayoutOptions`, `ignoreSavedPositions` flag, sibling segment width logic, `runFullLayout()` action, `DEFAULT_LAYOUT_OPTIONS`
  - `src/canvas/GraphCanvas.tsx`: Updated import/usage of `getLayoutedElements` with options; wired `runFullLayout` via `fitViewRef` → `onRunLayout` callback
  - `src/canvas/panels/sections/CanvasLayoutSection.tsx`: **New** — presenter with rankdir/nodesep/ranksep/nodeWidth controls + Run Layout button
  - `src/canvas/panels/sections/CanvasLayoutSectionContainer.tsx`: **New** — container with local UI state, wires `onRunLayout`
  - `src/canvas/panels/AppSidebar.tsx`: Added `onRunLayout` prop; mounts `CanvasLayoutSectionContainer` gated by `autoLayout`
  - `src/stories/CanvasLayoutSection.stories.tsx`: **New** — 4 stories (Default, ChangeDirection, AdjustSpacing, RunLayout)
  - `src/stories/AppSidebar.stories.tsx`: Added `onRunLayout` mock to match new prop
  - `vitest.config.ts`: Added `@dagrejs/dagre` to `optimizeDeps.include`
- **Verification:** npx tsc --noEmit clean, npm run build clean, 163/163 tests passing
- **Pre-commit guard:** no changes

### prd write + implement phase 1 — m5-prd0060-reintroducing-dagre-to-canvas
- **Source:** user text — dagre hardcoded off, needs feature flag toggle
- **Branch at time:** main (clean after commit)
- **PRD file:** `dev-docs/plans/m5-prd0060-reintroducing-dagre-to-canvas.md`
- **Phase:** 1 of N — feature flag + basic dagre toggle
- **Changes:**
  - `src/store/useGraphStore.ts`: Added `autoLayout: false` to `DEFAULT_FEATURE_FLAGS`
  - `src/canvas/panels/sections/FeatureFlagsSection.tsx`: Added `"Auto Layout (dagre)"` label
  - `src/engine/layout.ts`: Fixed `getLayoutedElements()` for containerGroup nodes, parentId, edge type "edgelabel", canvasData dimensions
  - `src/canvas/GraphCanvas.tsx`: Replaced `__experimentalNoDagre` const with reactive `featureFlags.autoLayout`, `prevAutoLayoutRef` for layoutRef reset on toggle
- **Verification:** npx tsc --noEmit clean, npm run build clean, 159/159 tests passing
- **Pre-commit guard:** committed wip (workflow-log.md)

### prd merge — m5-prd0059-entity-form-create-mode
- **Source:** user text — "prd merge"
- **Branch at time:** main (clean)
- **Merge order:** m5-prd0059-entity-form-create-mode (0059)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m5-prd0059-entity-form-create-mode
- **Source:** user text — "ok, you can prd-end"
- **Branch at time:** m5-prd0059-entity-form-create-mode (dirty — expected from prd start)
- **Change classification:** Feature change
- **ADR type:** short-form (no architectural changes)
- **Commit hash:** 5ca4b25
- **Pre-commit guard:** auto-proceeded (expected dirty from prd start)

---

## 2026-06-01

### prd merge — m5-prd0058-segment-metadata-conventions
- **Source:** user text — "prd-end, prd merge"
- **Branch at time:** main (clean)
- **Merge order:** m5-prd0058-segment-metadata-conventions (0058)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** committed wip (workflow log from prd end)

### prd end — m5-prd0058-segment-metadata-conventions
- **Source:** user text — "prd-end, prd merge"
- **Branch at time:** m5-prd0058-segment-metadata-conventions (clean — committed)
- **Change classification:** Planning
- **ADR type:** short-form (no architectural changes)
- **Commit hash:** c516099
- **Pre-commit guard:** auto-proceeded (expected dirty from prd start)

### prd start — m5-prd0058-segment-metadata-conventions
- **Source:** user text — "ok prd-start prod0058"
- **Branch at time:** main (clean — committed pre-existing wip)
- **Branch decision:** create from main → m5-prd0058-segment-metadata-conventions
- **Scope:** full PRD (single phase)
- **Pre-commit guard:** committed wip (PRD update from user request)

### prd merge — m5-prd0057-sort-order-fractional-indexing
- **Source:** user request — "merge this branch back to main no ff"
- **Branch at time:** main (clean — just merged)
- **Merge order:** m5-prd0057-sort-order-fractional-indexing (0057)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m5-prd0057-sort-order-fractional-indexing
- **Source:** user text — "prd-end for prd0057"
- **Branch at time:** m5-prd0057-sort-order-fractional-indexing (clean — committed)
- **User decision:** classification: Feature change + Architecture change
- **Change classification:** Feature change + Architecture change
- **ADR type:** full (new store actions as shared interface, dependency swap)
- **Commit hash:** 4bb3d99
- **Pre-commit guard:** auto-proceeded (uncommitted changes from implementation)

### prd start — m5-prd0057-sort-order-fractional-indexing
- **Source:** user text — "lets prd start for prd0057"
- **Branch at time:** main (clean — committed PRD docs)
- **User decision:** branch from main
- **Branch name:** m5-prd0057-sort-order-fractional-indexing
- **Scope:** full (single phase)
- **Pre-commit guard:** committed wip ("m5: prd docs (0057 + 0058)")

### prd write — m5-prd0058-segment-metadata-conventions
- **Source:** user request — extracted AC 10 from PRD 0057 into separate PRD
- **Branch at time:** main (dirty — 0057 + workflow-log from previous write)
- **User decision:** skip commit; documentation-only PRD, no type-system enforcement deferred
- **PRD file:** `dev-docs/plans/m5-prd0058-segment-metadata-conventions.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** skipped

### prd write — m5-prd0057-sort-order-fractional-indexing
- **Source:** user text — draft `dev-docs/plans/hello-migration-sort-order.md` → full PRD
- **Branch at time:** main (clean)
- **User decision:** milestone m5 (fallback, highest existing); NNNN=0057; universal sort scope with interleaving; any entity type can have sort order
- **PRD file:** `dev-docs/plans/m5-prd0057-sort-order-fractional-indexing.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** no changes

## 2026-05-28

### prd merge — m5-prd0054-metadata-in-sidebar
- **Branch at time:** main (clean)
- **Merge order:** m5-prd0054-metadata-in-sidebar (0054)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m5-prd0054-metadata-in-sidebar
- **Source:** user request — metadata section in sidebar
- **Branch at time:** m5-prd0054-metadata-in-sidebar (dirty)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** short-form (UI components, no architectural changes)
- **Commit hash:** 62a24bc
- **Pre-commit guard:** auto-proceeded (uncommitted changes from implementation)

### prd merge — m5-prd0056-create-auto-select
- **Branch at time:** main (clean)
- **Merge order:** m5-prd0056-create-auto-select (0056)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m5-prd0056-create-auto-select
- **Source:** user request — auto-select on create, context menu position fix
- **Branch at time:** m5-prd0056-create-auto-select (clean)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** short-form (UI behavior fixes, no architectural changes)
- **Commit hash:** 049cb80
- **Pre-commit guard:** no changes

### prd merge — m5-prd0055-node-hooks
- **Branch at time:** main (clean)
- **Merge order:** m5-prd0055-node-hooks (0055)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m5-prd0055-node-hooks
- **Source:** user request — shared resize + edit hooks
- **Branch at time:** m5-prd0055-node-hooks (clean)
- **User decision:** classification: Feature change + Architecture change
- **Change classification:** Feature change + Architecture change
- **ADR type:** full (shared hooks pattern, new hooks/ directory)
- **Commit hash:** e826c20
- **Pre-commit guard:** no changes

### prd end — m5-prd0054-metadata-in-sidebar
- **Source:** user request — metadata section in sidebar
- **Branch at time:** m5-prd0054-metadata-in-sidebar (clean)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** short-form (UI components, no architectural changes)
- **Commit hash:** fcaa549
- **Pre-commit guard:** no changes

### prd end — m5-prd0049-button-components
- **Source:** user request — archive remaining PRDs
- **Branch at time:** main (clean)
- **User decision:** archival only (already merged into main)
- **Change classification:** Feature change
- **ADR type:** short-form (UI components, no architectural changes)
- **Commit hash:** 9fb0a21
- **Pre-commit guard:** no changes (archival only)

### prd end — m5-prd0047-workspace-sidebar
- **Source:** user request — archive remaining PRDs
- **Branch at time:** main (clean)
- **User decision:** archival only (already merged into main)
- **Change classification:** Feature change
- **ADR type:** short-form (UI components, no architectural changes)
- **Commit hash:** 9fb0a21
- **Pre-commit guard:** no changes (archival only)

### prd end — m5-prd0052-canvas-header-and-undo-redo
- **Source:** user request — PRD0052 implementation
- **Branch at time:** main (dirty → committed)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** short-form (UI component props and layout changes, no architectural changes)
- **Commit hash:** 57223c2 (implementation) + 1d43cfa (docs)
- **Pre-commit guard:** auto-proceeded (uncommitted changes from implementation)

### prd merge — m5-prd0051-experimental-section
- **Branch at time:** main (clean)
- **User decision:** merge single branch
- **Merge order:** m5-prd0051-experimental-section (0051)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** committed docs

### prd end — m5-prd0051-experimental-section
- **Source:** user request — relate everything after prd0050 to prd0051-experimental-section
- **Branch at time:** m5-prd0051-experimental-section (dirty)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** short-form (UI components + refactoring, no architectural changes)
- **Commit hash:** ae25599
- **Pre-commit guard:** auto-proceeded (uncommitted changes from implementation)

## 2026-05-27

### prd end — m5-prd0050-switch-component
- **Source:** user request — labeled Switch component with invalid state
- **Branch at time:** m5-prd0050-switch-component (clean)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** short-form (component addition, no architectural changes)
- **Commit hash:** c893b4c
- **Pre-commit guard:** no changes (already committed)

### update — document container/presenter pattern in architecture.md
- **Source:** user request — "use dev-workflow and update our dev-docs"
- **Branch at time:** m5-prd0048-container-presenter-pattern (clean)
- **Change classification:** Architecture change
- **Docs updated:** `architecture.md` — added Storybook to tech stack, documented container/presenter pattern under new Component Architecture section, added sidebar sections to module map, added Storybook to verification steps
- **Pre-commit guard:** no changes (clean)

### prd end — m5-prd0048-container-presenter-pattern
- **Source:** user request — extract store access from sidebar sections into container/presenter pattern
- **Branch at time:** m5-prd0048-container-presenter-pattern (clean)
- **User decision:** classification: Architecture change + Feature change
- **Change classification:** Architecture change
- **ADR type:** full (container/presenter split, new file convention, project migration plan)
- **Commit hash:** 129a4d3
- **Pre-commit guard:** auto-proceeded (uncommitted changes from prd start)

### prd start — m5-prd0048-container-presenter-pattern
- **Source:** user request — migrate sidebar sections to container/presenter pattern, stacked on current branch
- **Branch at time:** m5-prd0047-workspace-sidebar (dirty — decorator work)
- **User decision:** commit decorated changes → stacked branch from m5-prd0047
- **Branch name:** m5-prd0048-container-presenter-pattern
- **Scope:** full (3 phases: FeatureFlags, WorkspaceInfo, Backups)
- **Pre-commit guard:** committed wip ("m5: prd0047 - add shared withSidebarSection decorator")

### prd write — m5-prd0048-container-presenter-pattern
- **Source:** user request — container/presenter migration for AppSidebar sections
- **Branch at time:** m5-prd0047-workspace-sidebar (dirty — decorator work)
- **User decision:** implement full migration in 3 phases
- **PRD file:** `dev-docs/plans/m5-prd0048-container-presenter-pattern.md`
- **Pre-commit guard:** skip (dirty from decorator — handled by prd start)

## 2026-05-25

### fix — removed depth limit, fixed sort + phantom undo entries
- **Source:** manual testing in browser revealed issues
- **Branch at time:** m5-prd0046-nested-containers
- **Changes:**
  - `src/engine/queries.ts`: Exported `wouldCreateCycle`, `getNestingDepth`
  - `src/store/useGraphStore.ts`: Removed depth limit from `updateEntity`, null `_pendingSnapshot` on cycle rejection (no phantom undo entries)
  - `src/canvas/GraphCanvas.tsx`: Fixed depth sort from binary child/non-child to recursive ancestor-depth sort (eliminated React Flow "Parent node not found" warnings)
  - `src/store/nesting.test.ts`: Changed depth limit test to verify arbitrary depth
- **Final status:** 85 tests passing + tsc --noEmit clean + build clean

### prd start — implement m5-prd0046-nested-containers
- **Source:** user request — proceed with nested containers implementation
- **Branch at time:** m5-prd0046-nested-containers (clean, new branch from main)
- **Changes:**
  - `src/engine/queries.ts`: Added `wouldCreateCycle` + `getNestingDepth` helpers
  - `src/store/useGraphStore.ts`: Imported helpers, added cycle/depth guard in `updateEntity`
  - `src/canvas/GraphCanvas.tsx`: Drag-to-assign for containers, "Add Child Container" context menu item, batch description count includes containers
  - `src/store/nesting.test.ts`: 20 new tests (9 pure function + 11 store integration)
- **Pre-commit guard:** clean
- **Final status:** implemented + all 85 tests passing + tsc --noEmit clean + build clean

### prd write — m5-prd0046-nested-containers
- **Source:** user request — nesting containers within containers
- **Branch at time:** main (clean)
- **User decision:** create PRD for nested containers + renumber i2 roadmap (PRD0046 inserted as #2, Threaded Container View bumped to PRD0047, View Toggling to PRD0049)
- **Pre-commit guard:** no changes

### update — vitest test framework + documentation sync
- **Source:** user request — add vitest to requirements after AGENTS.md update
- **Branch at time:** main (dirty → committed wip)
- **User decision:** commit wip → proceed with update workflow
- **Change classification:** Architecture change + Operator change + Bug fix / small tweak
- **Docs updated:** requirements.md (grid fix + test requirement), architecture.md (build pipeline + grid fix), changelog.md (new entry), ADR (archive/2026-05-25-vitest-test-framework-adr.md)
- **Pre-commit guard:** committed wip (4 files)

### prd merge — m5-prd0045-container-group-nodes
- **Branch at time:** main (clean)
- **User decision:** merge single branch
- **Merge order:** m5-prd0045-container-group-nodes (0045)
- **Conflicts:** none
- **Final status:** merged into main cleanly (12 files, 590 insertions)
- **Pre-commit guard:** no changes

### prd end — m5-prd0045-container-group-nodes
- **Source:** user request — container group nodes + entity height fix
- **Branch at time:** m5-prd0045-container-group-nodes (clean)
- **User decision:** classification: Architecture change + Feature change
- **Change classification:** Architecture change + Feature change
- **ADR type:** full (parentId schema, EntityType rename, grid sizing, container query approach, height model)
- **Commit hash:** 1b4b233
- **Pre-commit guard:** auto-proceeded (uncommitted changes from implementation)

## 2026-05-23

### prd merge — m4-prd0043-undo-redo-and-backup (includes 0044)
- **Branch at time:** main (clean)
- **User decision:** merge single branch containing both 0043 and 0044
- **Merge order:** m4-prd0043-undo-redo-and-backup (0043 + 0044)
- **Conflicts:** none
- **Final status:** merged into main cleanly (19 files changed)
- **Pre-commit guard:** no changes

### prd end — m4-prd0043-undo-redo-and-backup
- **Source:** user request — merged PRD for undo/redo + backups
- **Branch at time:** m4-prd0043-undo-redo-and-backup (clean)
- **User decision:** classification: Architecture change + Feature change
- **Change classification:** Architecture change + Feature change
- **ADR type:** full (snapshot engine, batch system, backup engine, new modules)
- **Commit hash:** 503b781
- **Pre-commit guard:** no changes

### prd end — m4-prd0044-schema-v5-canvas-data-on-entity
- **Source:** user request — positions and dimensions cause bugs in every feature touching them
- **Branch at time:** m4-prd0043-undo-redo-and-backup (dirty — implemented stacked)
- **User decision:** classification: Architecture change + Feature change
- **Change classification:** Architecture change + Feature change
- **ADR type:** full (schema v5, data model contract change)
- **Commit hash:** 1b3889a
- **Pre-commit guard:** auto-proceeded (uncommitted changes from implementation)

### prd start — m4-prd0044-schema-v5-canvas-data-on-entity
- **Source:** user request — resolve position reconciliation gap permanently
- **Branch at time:** m4-prd0043-undo-redo-and-backup (clean, committed)
- **User decision:** stacked on existing m4-prd0043 branch
- **Branch name:** m4-prd0043-undo-redo-and-backup (reused)
- **Scope:** full (single phase)
- **Pre-commit guard:** no changes

## 2026-05-22

### prd write — m4-prd0044-schema-v5-canvas-data-on-entity
- **Source:** user request — positions and dimensions cause bugs in every feature touching them (undo, restore, save, drag)
- **Branch at time:** m4-prd0043-undo-redo-and-backup (clean, committed)
- **User decision:** move positions/dimensions onto Entity as `canvasData: { x, y, width?, height? }`. Schema v4→v5 migration. Remove `canvas.positions`/`canvas.dimensions` from `CanvasState`. All user actions tracked by undo — specifically drag-ends and resize-ends now create undo entries. Auto-measurement bypasses tracking (system init, not user action).
- **PRD file:** `dev-docs/plans/m4-prd0044-schema-v5-canvas-data-on-entity.md`
- **Pre-commit guard:** committed wip ("m4: prd0043 - undo/redo + backups")

### prd start — m4-prd0043-undo-redo-and-backup
- **Source:** user text — merged PRD for undo/redo + backups
- **Branch at time:** main (clean)
- **User decision:** branch from main
- **Branch name:** m4-prd0043-undo-redo-and-backup
- **Scope:** full (single phase)
- **Pre-commit guard:** no changes

### prd write — m4-prd0043-undo-redo-and-backup (merged)
- **Source:** user observation — m4-prd0043 (undo/redo) and m4-prd0044 (backups) overlap on snapshot mechanism
- **Branch at time:** main (clean)
- **User decision:** merged both features into one PRD. Common foundation: snapshot-based history with in-memory undo stack (50 entries, Cmd+Z) + disk-persisted auto-backups (10 most recent, 2s idle guard, include documents) + manual FS saves. Backup panel shows manual saves (with date/time, restore, delete) and recent snapshots (with relative timestamps, restore only).
- **Old files deleted:** `m4-prd0043-undo-redo.md`, `m4-prd0044-save-backup.md`
- **New file:** `dev-docs/plans/m4-prd0043-undo-redo-and-backup.md`
- **Pre-commit guard:** no changes

### prd end — m4-prd0041-node-metadata-panel
- **Source:** roadmap: "Node metadata panel (NodeAppendix)"
- **Branch at time:** main (not on PRD branch — implemented directly)
- **User decision:** classification: Feature change + Architecture change
- **Change classification:** Feature change + Architecture change
- **ADR type:** full (new node type, edge-metadata engine module, edge-derived metadata data flow)
- **Commit hash:** 64ee3e8
- **Pre-commit guard:** no changes

## 2026-05-18

### prd merge — m4-prd0040-edge-inline-editing
- **Branch at time:** main (clean)
- **User decision:** merge single branch (m4-prd0040-edge-inline-editing)
- **Merge order:** m4-prd0040-edge-inline-editing (0040)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m4-prd0040-edge-inline-editing
- **Source:** roadmap: "Edge inline editing"
- **Branch at time:** m4-prd0040-edge-inline-editing (clean)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** no architectural changes
- **Commit hash:** a9f12e7
- **Pre-commit guard:** auto-proceeded (uncommitted changes from prd start)

### prd start — m4-prd0040-edge-inline-editing
- **Source:** roadmap: "Edge inline editing"
- **Branch at time:** main (clean)
- **User decision:** branch from main
- **Branch name:** m4-prd0040-edge-inline-editing
- **Scope:** full (single phase)
- **Pre-commit guard:** no changes

### prd write — m4-prd0041-node-metadata-panel
- **Source:** roadmap: "Node metadata panel (NodeAppendix)"
- **Branch at time:** main (dirty — prd0040 files)
- **User decision:** panel on node selection, simple two-column key-value table for metadata, context menu "Edit" opens panel
- **PRD file:** `dev-docs/plans/m4-prd0041-node-metadata-panel.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** skipped (uncommitted prd0040 files)

### prd write — m4-prd0040-edge-inline-editing
- **Source:** roadmap: "Edge inline editing"
- **Branch at time:** main (clean)
- **User decision:** freeform input + combobox dropdown of existing relation types
- **PRD file:** `dev-docs/plans/m4-prd0040-edge-inline-editing.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** no changes

### prd merge — m4-prd0039-cmd-drag-duplicate-node
- **Branch at time:** main (clean)
- **User decision:** merge single branch
- **Merge order:** m4-prd0039-cmd-drag-duplicate-node (0039)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** committed wip ("docs")

### prd end — m4-prd0039-cmd-drag-duplicate-node
- **Source:** roadmap: "Cmd+drag to duplicate node"
- **Branch at time:** m4-prd0039-cmd-drag-duplicate-node (clean)
- **User decision:** classification: Feature change + Architecture change
- **Change classification:** Feature change + Architecture change
- **ADR type:** full (`setCanvasPositions` merge → `replaceCanvasPositions` split, store contract changed)
- **Commit hash:** 5564d09 (archive)
- **Pre-commit guard:** no changes (already committed)

### prd start — m4-prd0039-cmd-drag-duplicate-node
- **Source:** roadmap: "Cmd+drag to duplicate node"
- **Branch at time:** main (clean)
- **User decision:** branch from main
- **Branch name:** m4-prd0039-cmd-drag-duplicate-node
- **Scope:** full (single phase)
- **Pre-commit guard:** no changes

### prd write — m4-prd0039-cmd-drag-duplicate-node
- **Source:** roadmap: "Cmd+drag to duplicate node"
- **Branch at time:** main (clean)
- **User decision:** full clone (kind+content+metadata), preserve relative positions on multi-select, no auto-edit mode
- **PRD file:** `dev-docs/plans/m4-prd0039-cmd-drag-duplicate-node.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** no changes



### prd merge — cursor-styles → create-node-on-double-click → prd0037-zoom-improvements → m4-prd0038-save-node-positions
- **Branch at time:** m4-prd0038-save-node-positions (clean)
- **User decision:** follow suggested order; archived prd0037 before merge
- **Merge order:** cursor-styles (0035) → create-node-on-double-click (0036) → prd0037-zoom-improvements (0037) → m4-prd0038-save-node-positions (0038)
- **Conflicts:** none
- **Final status:** all 4 branches merged into main cleanly
- **Pre-commit guard:** committed ("m4: prd0038 - save node positions (archive, changelog, ADR)")

### prd end — m4-prd0038-save-node-positions
- **Source:** user text: "Save node positions — schema v4..."
- **Branch at time:** m4-prd0038-save-node-positions (clean)
- **User decision:** classification: both architecture + feature change
- **Change classification:** Architecture change + Feature change
- **ADR type:** full (schema v4, data flow change)
- **Commit hash:** 8f61254 (implementation) + 55eed96 (fix)
- **Pre-commit guard:** no changes (already committed)

### prd start — m4-prd0038-save-node-positions
- **Source:** user text: "Save node positions — schema v4..."
- **Branch at time:** prd0037-zoom-improvements (clean)
- **User decision:** stacked on prd0037-zoom-improvements
- **Branch name:** m4-prd0038-save-node-positions
- **Scope:** full (single phase)
- **Pre-commit guard:** committed ("docs")

### prd write — m5-prd0047-workspace-sidebar
- **Source:** user text: "build the prd putting things in their right places..."
- **Branch at time:** m5-storybook (clean)
- **User decision:** Replace WorkspaceMenu entirely, sidebar toggle replaces DotsThreeOutline icon, persist everything (open/closed + sections), sections: Feature Flags + Backups + Workspace Info
- **PRD file:** `dev-docs/plans/m5-prd0047-workspace-sidebar.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** clean

### prd write — m4-prd0038-save-node-positions
- **Source:** user text: "Save node positions — schema v4..."
- **Branch at time:** prd0037-zoom-improvements (clean)
- **User decision:** N/A
- **PRD file:** `dev-docs/plans/m4-prd0038-save-node-positions.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** committed wip ("skill improvement")

