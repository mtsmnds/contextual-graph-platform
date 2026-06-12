# Architecture

## Purpose
How the system is designed and where core responsibilities live.

## System Architecture

```
Entity Graph → Projection Layer → Renderer

Persistence:
  IndexedDB ←↔ Store (always — runtime persistence via IndexedDBAdapter)
  Disk        ← UI open/save/close (explicit checkpoints via FSAdapter)
```

The core is a **Relation-Native Content Engine**. Entities carry content directly. Relations carry typed links. Projections interpret the graph for a specific use case. Renderers display projections.

IndexedDB is always the runtime store. FS disk operations are invoked only by explicit user action (Open Folder, Save). No auto-save to disk, no background sync, no silent reconnect.

React Flow will be reintroduced as one renderer among many (graph visualization) in Phase 4. It is NOT the core runtime.

Guiding principle: *The graph is infrastructure. The viewport is the product. Renderers are interchangeable. Contextual reading is the core interaction.*

## System Style
- Architecture style: React SPA with a content-graph engine at the core
- Deployment style: Tauri-packaged desktop app (dev via `npm run dev`)
- Execution model: Client-side SPA, no server

## Component Architecture

### Container/Presenter Pattern

Stateful UI components follow a container/presenter split:

- **Presenter** — a pure render function. Accepts all data and callbacks as explicit props. Zero side effects, zero store imports. Default export from the `.tsx` file. Used directly in Storybook stories.
- **Container** — owns store reads, async orchestration, dialog state, and effects. Renders the presenter with props derived from state. Named `{Name}Container.tsx` alongside the presenter.

```
sections/
  FeatureFlagsSection.tsx          ← presenter (props: flags, onToggle)
  FeatureFlagsSectionContainer.tsx ← container (reads useGraphStore)
  BackupsSection.tsx               ← presenter (all state + callbacks as props)
  BackupsSectionContainer.tsx      ← container (owns dialogs + backup ops)
```

Container always renders exactly one presenter. Presenters never import the store. This makes presenters isolatable for Storybook and unit tests without mocking.

### Storybook

**Decorators for providers:** Use decorators for provider/layout wrapping
(`SidebarProvider`, context providers, layout containers). Stories should only
show the component and its props in the code panel. Use `parameters` for per-story
configuration passed to the decorator.

**Never wrapper components:** Never create wrapper components (e.g., `SidebarDemo`)
as the story's `component`. Use real components directly in `render` or let the
decorator + `component` default handle it.

**JSDoc on every component:** Every component exported from `src/` should have a
JSDoc description explaining what it does and when to use it. Storybook picks
these up automatically for the docs page.

**ArgTypes with descriptions:** Every prop needs a description in `argTypes`,
not just a type. One line explaining what it controls.

**Stories are use cases, not prop permutations:** Each story represents a
meaningful, visually distinct state (e.g., "With multiple backups", "Empty workspace",
"Loading state"). If two stories render identically, remove one.

**Mock data fixtures:** Create mock data in a `__mocks__` or `__fixtures__` directory
colocated with stories. Reuse across stories and tests.

**Presenters:** Accept explicit props with `fn()` callbacks for actions. Interactive
stories use stateful `render` wrappers for controlled components.

Global decorators in `.storybook/preview.tsx` provide `BrowserRouter`. Shared
section decorators live in `.storybook/decorators.tsx`.

## Tech Stack
- Vite 8 + React 19 + TypeScript
- Zustand 5 — global state
- Vitest — unit testing (pure functions, store actions, state transitions)
- Storybook 10 — component development environment (isolated rendering + interaction tests)
- @xyflow/react (React Flow) — optional graph renderer (Phase 4+, installed but not imported)
- @phosphor-icons/react — icon library
- Native CSS nesting (no preprocessor)
- TipTap — rich text editor
- @dagrejs/dagre — auto-layout

## Build Pipeline
Entrypoint: `npm run build` → `vite build`

1. **Vite dev** (`npm run dev`) — esbuild transpilation, HMR, static file serving.
2. **Type check** (`npx tsc --noEmit`) — static type verification.
3. **Unit tests** (`npx vitest run`) — state/logic coverage via vitest.
4. **Production build** (`npm run build`) — rolldown bundling, CSS/JS minification, output to `dist/`.

## Data Contracts

### Domain Model (`src/types/graph.ts`)

#### Entity
The atomic semantic object. Two roles:

- **Containers** (`kind: "container"`) — structural labels with `title`. Their body content lives in a separate content store (`react-roadmap:content:{id}` in localStorage), not inline on the entity. This keeps the graph lightweight and queryable without parsing document bodies. Examples: work ("Hamlet"), note ("Meeting Notes").
- **Segments** (`kind: "segment"`) — legacy content carriers from the hamlet import. They have both `title` and inline `content` (plain text). New documents use containers with external content storage instead.

```ts
type EntityKind = "segment" | "container" | "annotation" | "concept" | "summary"

type Entity = {
  id: string
  kind: EntityKind
  title?: string         // container heading or segment label
  content?: string       // LEGACY: body text for hamlet segments only. Containers store content externally via getContent/saveContent.
  metadata: Record<string, unknown>   // type-specific data (e.g. character name, work type)
}
```

#### Relation
Typed edge between entities. No `EdgeBehavior` — behavior belongs to the interaction layer, not storage.

```ts
type RelationType = "contains" | "next" | "references" | "annotates" | "summarizes" | "related_to"

type Relation = {
  id: string
  source: string
  target: string
  type: RelationType
  metadata: Record<string, unknown>
}
```

Key relation patterns:
- `contains` — hierarchy (work → act → scene → segments)
- `next` — document order chain within a container
- `annotates` — annotation linked to a segment
- `references` — cross-work reference

#### View State
Separate from domain state entirely.

```ts
type ViewState = {
  focusedEntityId: string | null   // the root container in view (resolved to work)
  anchorEntityId: string | null    // the original entity clicked (for breadcrumb)
  visibleEntityIds: string[]
  expandedPanels: string[]
}
```

### Store (`src/store/useGraphStore.ts`)
- `entities: Entity[]` — domain graph entities (lightweight: no inline content for containers).
- `relations: Relation[]` — typed edges.
- `view: ViewState` — UI-only state, separate from domain.
- `contentLoaded: Record<string, boolean>` — tracks which container contents have been loaded from storage.
- `adapterId: string` — always `"indexeddb"` at runtime (resolver no longer supports FS as persistence backend).
- `folderName: string | null` — folder name when FSAdapter is active (set by `openFromDisk`, cleared by `closeDisk`/`closeWorkspace`).
- `lastDiskSaveAt: number` — timestamp of the last successful save to disk (set by `openFromDisk` and `saveToDisk`).
- `isDirty(): boolean` — `lastMutationTime > lastDiskSaveAt`. Returns true when unsaved changes exist.
- Initialization: `init(adapter)` — injects the `IndexedDBAdapter` at startup. Checks `localStorage` flag `react-roadmap:folder-open` before restoring IndexedDB data. If the flag is set (stale folder session from a reload without FS handle), forces seed data instead. Otherwise calls `loadWorkspace()`, applies version migration, loads container content docs. Falls back to seed data if the adapter returns no workspace.
- Mutations: `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `updateRelation`, `removeRelation`.
- View actions: `focusEntity(id, anchorId?)`, `expandPanel`, `closePanel`.
- Content actions: `getContent(id)` — reads from in-memory content cache; `saveContent(id, data)` — writes to cache + adapter's `saveDocument()`; `clearContent(id)` — removes from cache + adapter's `deleteDocument()`. Container document bodies are NOT stored on the entity.
- FS actions: `openFromDisk(snapshot, folderName)` — replaces entities/relations/canvas, resets undo/redo, sets `folderName` + `lastDiskSaveAt`, sets localStorage flag. `saveToDisk()` — calls `_fsAdapter.save()` with current snapshot, sets `lastDiskSaveAt`. `closeDisk()` — calls `_fsAdapter.close()`, clears `folderName` + localStorage flag. `closeWorkspace()` — resets to seed data via `generateSeedData()`, clears adapter + FS handles + localStorage flag.
- ID scheme: New containers use `generateDocId()` (timestamp-based `doc_{timestamp}`); segments use `{parent}_seg-{counter}`; root entities use slugified title.
- Persistence: Auto-save is debounced (300ms) — writes `GraphSnapshot` (entities + relations) to IndexedDB's `saveGraph()` on every entity/relation change. Content docs go through `saveDocument()`. No auto-save to disk.
- `generateSeedData()` — module-level helper that produces fresh seed entities/relations/container content from `SEED_DATA`. Used by `init`'s seed branch and `closeWorkspace`.
- URL sync: On view state change, `focusedEntityId` and `anchorEntityId` are synced to URL search params (debounced 200ms, `history.replaceState`). On app load, URL params are read to restore the view.

### Persistence Layer (`src/store/persistence/`)

IndexedDB is always the runtime store. The FS adapter is a standalone module invoked by explicit user action only.

#### IndexedDBAdapter (runtime backend)

Implements `PersistenceAdapter` for runtime persistence:

```ts
interface PersistenceAdapter {
  readonly id: AdapterType  // "indexeddb"
  loadWorkspace(): Promise<WorkspaceSnapshot | null>
  saveGraph(snapshot: WorkspaceSnapshot): Promise<void>
  loadDocument(id: string): Promise<Record<string, unknown> | null>
  saveDocument(id: string, data: Record<string, unknown>): Promise<void>
  deleteDocument(id: string): Promise<void>
  getFolderName(): string | null   // always returns null
  getRootHandle?(): FileSystemDirectoryHandle | null  // always returns null
}
```

- Uses Dexie.js for IndexedDB access (async, unlimited quota for current scale). Table `graph` stores the workspace snapshot; table `documents` stores per-container content docs. No user interaction needed.

#### FSAdapter (explicit disk checkpoint)

Standalone class (NOT a `PersistenceAdapter`). Invoked by the UI layer only:

```ts
class FSAdapter {
  open(): Promise<GraphSnapshot | null>       // picker → read → validate
  save(snapshot: GraphSnapshot): Promise<void> // write graph.json
  close(): void                                // clear handle + log
  isOpen(): boolean
  getFolderName(): string | null
  getRootHandle(): FileSystemDirectoryHandle | null
  getStatus(): FSAdapterStatus
  getLog(): FSLogEntry[]
}
```

- Uses raw File System Access API (`showDirectoryPicker`, `getFileHandle`, `createWritable`).
- Reads/writes `graph.json` only — does NOT handle per-document files (out of scope).
- `open()` returns `null` if user cancels the picker. Also returns `null` if the folder has no `graph.json` (caller checks `isOpen()` to distinguish from cancel). Throws `FSError` on permission/parse/validation/version errors.
- Includes `validateSnapshot()` for schema validation and a 100-entry ring-buffer operation log.

#### FSError

Typed error with machine-readable code:

```ts
type FSErrorCode =
  | "PERMISSION_DENIED"      // handle expired or permission revoked
  | "NOT_FOUND"              // graph.json does not exist (open() returns null instead of throwing)
  | "PARSE_FAILED"           // file exists but is not valid JSON
  | "VALIDATION_FAILED"      // JSON is valid but shape is wrong
  | "VERSION_TOO_NEW"        // file version > app supported version
  | "WRITE_FAILED"           // file write failed (disk full, permission, etc.)
  | "NO_FOLDER_OPEN"         // operation attempted without an open folder
  | "USER_CANCELLED"         // user dismissed the directory picker
```

#### Resolver (`src/store/persistence/resolver.ts`)

Always returns `IndexedDBAdapter`. The old auto-detection and `tryReconnect` paths are removed. URL override (`?adapter=`) kept for testing but both options return IndexedDBAdapter.

#### Stale Folder Session Detection

On cold start, `init()` checks `localStorage` flag `react-roadmap:folder-open`:
- **Flag set** → user reloaded after a folder session without closing. Force seed data — the FS handle is lost and the IndexedDB data from the folder session can't be saved back to disk.
- **No flag** → normal cold start. Restore IndexedDB data.
- Flag is set by `openFromDisk`, cleared by `closeDisk` and `closeWorkspace`.

#### Deprecated: FSAccessAdapter

`src/store/persistence/fs-access-adapter.ts` implements the old `PersistenceAdapter` interface with auto-save and silent reconnect. Preserved as-is for the legacy `/tiptap-editor-test` route (`TiptapSidebar.tsx`). No production code imports it.

### Query Engine (`src/engine/queries.ts`)
Pure functions over store state — no hooks, no components:

```ts
getEntity(state, id): Entity | undefined
getRelations(state, entityId): Relation[]
getLinkedContext(state, entityId): { entity: Entity; relation: Relation }[]

getContainerChildren(state, containerId, depth?): Entity[]
  // Recursive: returns all descendant segments flattened.
  // Children are ordered by relation.sortOrder (fractional-indexing).
  // Sub-containers (acts, scenes) are kept as visual dividers;
  // their children (speeches, stage directions) follow inline.

resolveContainer(state, entityId): string
  // Walks up `contains` relations to the root (work-level container).

getContainerBreadcrumb(state, containerId): { id: string; title: string }[]
  // Path from root to the given entity (e.g. "Hamlet / Act I / Scene I").
```

Store actions (live `useGraphStore`):

```ts
getEdgesForNode(id, direction?): Relation[]
  // Returns relations scoped to source (out), target (in), or both.

queryThread({ target, relationType }): Entity[]
  // Filters relations by target id + relation type, sorts by sortOrder,
  // maps to source entities. This is the "document" projection primitive.
```

### Reading Viewport
The reading viewport (`src/renderers/ReadingViewport.tsx`) is the legacy renderer (mounted at `/tiptap-editor-test`).

- **Scope**: When the user clicks any entity on the canvas, `resolveContainer` finds the root work. `getContainerChildren` flattens all descendants into a single scrollable list. The root entity (work) renders first as SegmentCard, then all children in order.
- **Navigation**: Free scrolling is the primary interaction. The breadcrumb shows position in the hierarchy. Clicking a breadcrumb item refocuses the root with that item as anchor (same view, scrolled position).
- **SegmentCard variants**: Act, scene, title-page, front-matter, stage-direction, character speech, end-matter, dramatis-personae — each renders with appropriate typography and spacing.
- **Navigation**: The app is a single-mode reading workspace. `focusedEntityId === null` shows the HomePage (root container listing). `focusedEntityId !== null` shows the ReadingViewport with TipTap editing. Sidebar (`AppSidebar`) provides persistent page navigation.

### Graph Canvas
The graph canvas (`src/canvas/GraphCanvas.tsx`) is the primary renderer at `/`, mounted inside `WorkspaceShell`.

- Renders a full-height React Flow canvas with `Background` (dots), `Controls`, `MiniMap`.
- Entities render as custom `"entity"` nodes (EntityNode component registered at module scope). Relations render as custom `"edgelabel"` edges (EdgeLabel component) with always-visible interactive labels — double-click the label to enter inline edit mode (text input + combobox dropdown of existing relation types).
- **Panel buttons** (top-right): Undo, Redo, Zoom controls, Sidebar trigger. Sidebar and footer chrome (Open Folder, Save, Close Workspace) are owned by `WorkspaceShell`.
- **Interactions:**
  - Double-click pane → creates new node at click position (native DOM `dblclick` listener with capture phase; React Flow's synthetic `onDoubleClick` never fires)
  - Double-click node body → inline text editing (textarea with `nodrag nowheel nopan`, Enter=newline, Escape/blur=commit)
  - Context menu "Edit" on node → triggers inline editing via `editTrigger` counter on node data
  - Double-click edge label → inline editing (text input + combobox; Enter/blur to commit via `updateRelation`, Escape to cancel; dropdown click commits immediately)
  - Drag from node handle → creates edge with type `"related_to"`; source/target handle IDs stored in relation metadata
  - Select + Backspace/Delete → deletes selected nodes/edges (node deletion cascades to relations)
  - Right-click node → context menu (Edit, Delete)
  - Right-click edge → context menu (Delete Edge)
  - Right-click pane → context menu (New Node)
  - `isValidConnection` prevents self-connections
- **Handles:** 4 handles per node (top/right/bottom/left), all `type="source"` — direction captured by source→target in Connection. `BaseHandle` component (14px dot, 2px border, `::before` expansion to ~18px hit area).
- **Resize:** Invisible `NodeResizeControl` on left and right edges (cursor-only, no visible dots). Min width 60px. Top/bottom resize removed — height governed by textarea content.
- **Canvas props:** `zoomOnDoubleClick={false}`, `panOnDrag={false}`, `panOnScroll={true}`, `selectionOnDrag={true}`, `connectionMode={ConnectionMode.Loose}`, `snapToGrid` (16×16), `multiSelectionKeyCode="Shift"`.
- **Sync:** Diff-based — positions live in React Flow state, never the store. Store changes add/remove nodes/edges by ID and merge data labels, preserving user-dragged positions.
- **Layout:** Dagre is disabled (`__experimentalNoDagre`). Node positions are store-authoritative only — user-dragged positions are the sole source of truth. `setCanvasPositions` merges new positions under existing ones (never drops unsaved positions); `replaceCanvasPositions` is used only by the re-layout button for deliberate bulk reset. New nodes enter at cursor/viewport-center via `pendingNodeRef`.
- **Cursor styles:** Pane → `default`, node body → `grab` (dragging → `grabbing`), text → `default`, edge labels → `default`, handles → `grab`. All via CSS with `!important` on pane to override React Flow's inline pointer from `selectionOnDrag`.

### Output / State
- `dist/` — production build.
- Store persists through IndexedDBAdapter (`react-roadmap` database in IndexedDB). FSAdapter is invoked only by explicit Save — it writes `graph.json` to a user-picked directory without auto-save. On first visit (no stored data), seed data from `src/data/seed.ts` is loaded automatically.

## Graph & Object Shapes

The canonical shape definitions live in two files:

| File | Purpose |
|------|---------|
| `src/types/graph.ts` | Core graph primitives — `Entity`, `Relation`, `ViewState`, `GraphSnapshot` |
| `src/types/domain.ts` | Domain-typed entity shapes — `AuthorEntity`, `BookEntity`, and their metadata types (`AuthorMetadata`, `BookMetadata`) |

Entity/Relation shapes in this document are summaries. Always refer to the source files above as the single source of truth.

### Metadata conventions

The `Entity.metadata` field (`Record<string, unknown>`) carries per-entity-type data. The following conventions are documented here (type-system enforcement is deferred to a future PRD):

#### `metadata.lineNumber`

- Type: `number`.
- User decides whether a segment has a `lineNumber` (not enforced by the system).
- Usually present for works with canonical line numbering (plays, poems).
- Usually absent for prose (novels, essays).
- Example: `{ metadata: { character: "barnardo", lineNumber: 1 } }`

#### `metadata.character`

- Type: `string`.
- User decides whether a segment has a `character` (not enforced by the system).
- Usually present in play dialogue lines.
- Usually absent for prose, narration, stage directions, and non-dialogue segments.

## Module Map

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | Root component — BrowserRouter shell, routes `/` (WorkspaceRoot) and `/tiptap-editor-test` (LegacyApp) |
| `src/components/AppSidebar.tsx` | Permanent shadcn sidebar — page list, home link, new page button |
| `src/components/HomePage.tsx` | Home page — root container cards, new page CTA, save status |
| `src/types/graph.ts` | Entity/Relation/ViewState type definitions |
| `src/store/useGraphStore.ts` | Zustand store (domain + view state + openFromDisk/saveToDisk/closeDisk/isDirty, seed data reset) |
| `src/store/persistence/types.ts` | PersistenceAdapter interface, WorkspaceSnapshot, AdapterType |
| `src/store/persistence/indexeddb-adapter.ts` | IndexedDB adapter (Dexie) — always the runtime backend |
| `src/store/persistence/FSAdapter.ts` | Standalone FS adapter for explicit open/save/close |
| `src/store/persistence/FSAdapter.test.ts` | 48 unit tests for FSAdapter (error codes, validation, lifecycle, operation log) |
| `src/store/persistence/fs-access-adapter.ts` | **DEPRECATED** — old FS adapter (preserved for legacy `/tiptap-editor-test` route) |
| `src/store/persistence/resolver.ts` | Adapter resolution — always returns IndexedDBAdapter; `getFSAccessInstance()` for legacy route |
| `src/store/persistence/index.ts` | Re-exports all persistence modules (FSAdapter, FSError, deprecated FSAccessAdapter) |
| `src/types/fs-access.d.ts` | File System Access API type declarations |
| `src/engine/layout.ts` | Dagre LR layout: entities/relations → React Flow nodes/edges |
| `src/engine/queries.ts` | Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext, getContainerChildren, resolveContainer, getContainerBreadcrumb) |
| `src/canvas/GraphCanvas.tsx` | Pure React Flow canvas view — nodes, edges, context menu, panel buttons. No SidebarProvider or AppSidebar (these live in WorkspaceShell) |
| `src/canvas/nodes/EntityNode.tsx` | Custom entity node — canvas chrome div + 4 handles + SegmentCard(ContentEditor) + NodeResizeControl |
| `src/components/base-handle.tsx` | Handle component (14px dot, 2px border, ::before hit-area expansion) |
| `src/components/SegmentCard.tsx` | Portable card component for non-container entities — variant system (bordered/none/hover), width prop, built-in padding/layout. Variant styles are Tailwind classes in the component (not index.css). |
| `src/components/ContainerCard.tsx` | Portable card frame for container entities — variant system (bordered/none/hover), header prop, consumer-controlled children slot |
| `src/components/ContentEditor.tsx` | Reusable view/edit content editor with auto-sizing textarea (field-sizing: content), double-click to edit, cursor-at-end on entry, no @xyflow/react dependency |
| `src/canvas/edges/EdgeLabel.tsx` | Custom edge component with inline label editing (double-click → input + combobox) |
| `src/canvas/GraphContextMenu.tsx` | Manual positioned context menu (not shadcn/Radix — avoids trigger-wrapper conflicts with React Flow) |
| `src/canvas/panels/AppSidebar.tsx` | Right-side collapsible sidebar — ViewSwitcher, workspace info, feature flags, backups, open folder |
| `src/components/chrome/WorkspaceShell.tsx` | Shared workspace wrapper — owns init, beforeunload, SidebarProvider, AppSidebar, FS open orchestration, view switching |
| `src/components/chrome/ViewSwitcher.tsx` | Canvas/Text view toggle in the sidebar |
| `src/components/chrome/TextView.tsx` | Placeholder text view showing entity count |
| `src/store/useChromeStore.ts` | Zustand store for chrome/shell UI state (activeView) |
| `src/canvas/panels/sections/FeatureFlagsSection.tsx` | Presenter: feature flag toggles (flags, onToggle) |
| `src/canvas/panels/sections/FeatureFlagsSectionContainer.tsx` | Container: reads featureFlags + setFeatureFlag from store |
| `src/canvas/panels/sections/WorkspaceInfoSection.tsx` | Presenter: folder name, entity count, undo/redo buttons, viewport |
| `src/canvas/panels/sections/WorkspaceInfoSectionContainer.tsx` | Container: reads store data, renders presenter |
| `src/canvas/panels/sections/BackupsSection.tsx` | Presenter: backup/snapshot lists, create/restore/delete actions, dialogs |
| `src/canvas/panels/sections/BackupsSectionContainer.tsx` | Container: owns dialog state + async backup engine calls |
| `src/renderers/ReadingViewport.tsx` | Continuous-scroll reading viewport with SegmentCard variants |
| `src/data/seed.ts` | Seed data (2 containers with Tiptap content, loaded on first visit) |
| `src/components/ui/` | shadcn/ui components (sidebar, button, etc.) |
| `src/lib/utils.ts` | cn() utility for Tailwind class merging |
| `src/index.css` | Global styles, Tailwind theme, shadcn CSS variables, dark mode |
| `scripts/import-gutenberg.ts` | Gutenberg HTML → JSON converter |
| `dist/` | Build output (gitignored) |

## Change Impact
- Schema change → update `src/types/graph.ts` + `dev-docs/architecture.md` + `dev-docs/changelog.md` + ADR.
- Store action change → update `src/store/useGraphStore.ts` + `dev-docs/architecture.md`.
- Query engine addition → update `src/engine/` + `dev-docs/architecture.md`.
- Pipeline change → update this doc + `dev-docs/changelog.md` + ADR.

## Verification
- `npx tsc --noEmit` — type check.
- `npx vitest run` — unit tests.
- `npm run storybook` — Storybook dev server (verify components render in isolation).
- `npm run build` — production build.

## Related Docs
- `requirements.md` — intent and constraints.
- `roadmap.md` — priorities.
- `changelog.md` — history.
- `AGENTS.md` — operating conventions.
- `dev-docs/prd0001-contextual-graph-platform/contextual_graph_platform_architecture_review.md` — full review rationale.
