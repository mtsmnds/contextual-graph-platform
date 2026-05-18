> **Completion note (2026-05-17):**
> - **What was built:** 7 incremental UI refinements — cursor style, selected node indicator, Figma-style interaction model, MiniMap/Controls positioning, shadcn ButtonGroup for panel/zoom controls, and a custom entity node powered by React Flow's BaseNode component (with Badge showing entity kind).
> - **Key decisions:** BaseNode from reactflow.dev shadcn registry handles selection styling internally via `in-[.selected]`, eliminating the manual CSS override. `nodeTypes` defined at module scope (not `useMemo`) for stable reference. Entity typed as `Node<EntityNodeData, "entity">` for full TS safety.
> - **Deviations from plan:** Connection handles deferred — will be added in a separate step. Monochrome node styling (no EntityKind color coding) per user preference.
> - **Postponed:** Connection handles (source/target) for edge creation.

## Task: Test and UI refinement

### Purpose

A lightweight PRD for a series of small, incremental adjustments discovered through real-world testing with the `~/Code/hello2` dataset. Instead of filing each tweak as its own PRD, this PRD collects them into a single batch — no more than a few lines of code each, fast to implement and verify.

Each request is small enough that the agent should implement it immediately after the user states it, without needing to pre-plan. This PRD exists to document the batch and provide an archive point.

### Scope

- UI polish: layout, spacing, label rendering, button placement
- Data insertion: injecting test entities/relations directly into the graph for debugging
- Interaction refinements: edge cases in CRUD, missing gestures, feedback improvements
- Any other sub-5-line change that doesn't warrant its own PRD

### Completed changes

#### 1. Cursor — grab → default
- `.react-flow__pane.draggable { cursor: default !important; }` replaces the grab hand with a default pointer on the canvas pane.

#### 2. Selected node indicator — visible outline
- `.react-flow__node.selected { outline: 2px solid oklch(0.6 0.15 260); outline-offset: 2px; border-radius: 4px; }` gives selected nodes a prominent blue ring.

#### 3. Interaction model — Figma-style controls
- `panOnDrag={false}`, `panOnScroll={true}`, `selectionOnDrag={true}`, `selectionMode={SelectionMode.Partial}`. Canvas drags create selection rectangles, scroll-wheel pans, click selects.

#### 4. Controls positioning — MiniMap above Controls
- Replaced `showInteractive` Controls with shadcn `ButtonGroup` + `Button` icons (`ZoomIn`, `ZoomOut`, `Maximize`). MiniMap at bottom-right with `bottom: 42px`, zoom buttons in a Panel at bottom-right with `marginBottom: 8`. Gaps: 8px between MiniMap and zoom buttons, 8px between zoom buttons and viewport bottom.

#### 5. Panel buttons — shadcn ButtonGroup
- Top-right buttons (New Node, Open Folder, Re-layout) wrapped in `ButtonGroup` with `Button variant="outline" size="sm"`. Replaced raw `<button>` elements.

#### 6. Zoom controls — shadcn ButtonGroup
- Replaced built-in `<Controls>` with custom shadcn `ButtonGroup` + `Button size="icon"`. Uses `reactFlowInstance.zoomIn()`, `zoomOut()`, `fitView()`. `aria-label` on each button.

#### 7. Custom entity node — BaseNode + EntityNode
- Installed `BaseNode` family (BaseNode, BaseNodeHeader, BaseNodeHeaderTitle, BaseNodeContent, BaseNodeFooter) from `https://ui.reactflow.dev/base-node` via shadcn CLI
- Installed shadcn `Badge` component
- Created `src/canvas/nodes/EntityNode.tsx` — custom node composing `BaseNode` + `BaseNodeHeader` + `BaseNodeHeaderTitle` + `BaseNodeContent` + `Badge` for entity kind indicator
- Registered `nodeTypes = { entity: EntityNode }` at module scope in `GraphCanvas.tsx` (stable reference, no re-renders)
- Changed `type: "default"` → `type: "entity"` in `src/engine/layout.ts`
- Removed manual `.react-flow__node.selected` CSS — BaseNode handles selection styling with `in-[.selected]` utility
- Typed as `Node<EntityNodeData, "entity">` for full TypeScript safety
- Entity node displayed with header (title) + content (kind badge), width 200px

### Out of scope

- New features (thread view, query builder — those are II.10/II.11)
- Architecture changes
- Schema changes
