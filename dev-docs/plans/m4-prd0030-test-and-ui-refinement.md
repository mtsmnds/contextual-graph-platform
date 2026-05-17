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

### Out of scope

- New features (thread view, query builder — those are II.10/II.11)
- Architecture changes
- Schema changes
