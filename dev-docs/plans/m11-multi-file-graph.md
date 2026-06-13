# m11 — Multi-File Graph Architecture

## Purpose

Split the monolithic `graph.json` into a multi-file folder structure to support large books (400+ segments per chapter × 12 chapters). The primary consumer is the text-view — it needs to open a book and navigate chapters without loading 800+ entities upfront.

Supersedes `new-graph-plan.md` (deprecated). Incorporates the analysis from the draft spec and synthesizes it with the v4 plan.

---

## Architecture

### File Layout

```
hello2/
├── manifest.json            ← entry point, maps book IDs → sub-file paths
├── graph.json               ← base layer: authors, books, concepts, geography
│                              + primary edges (type, author, year, language, format, setting)
│                              + derived edges (note, theme, symbol, allusion, ...)
│
└── lord-of-the-flies--william-golding/
    ├── EN-content.json      ← EN-content container + frontmatter entities
    │                          + contains: book→EN-content, EN-content→EN-c1..EN-c12
    ├── EN-c1.json           ← EN-c1 container + EN-c1-* segments + contains edges
    ├── EN-c2.json           ← same pattern
    ├── EN-c3.json
    ├── ...
    └── notes.json           ← notes container + notes-* entities
                              + contains: book→notes, notes_container→notes
                              + annotation edges (note, theme, symbol, allusion, …)
                              — SOURCE OF TRUTH for annotation relations
```

Folder names match book entity IDs.

### Naming Convention

Language code comes **first** in content/chapter/segment IDs:

```
lord-of-the-flies--william-golding--EN-content
lord-of-the-flies--william-golding--EN-c1
lord-of-the-flies--william-golding--EN-c1-001
```

Multi-language parallelism:

```
...--EN-content    ...--EN-c1    ...--EN-c1-001    (English)
...--PT-content    ...--PT-c1    ...--PT-c1-001    (Portuguese)
```

This means:
- No ID collision between languages
- Filter by language is trivial (prefix match on `--EN-` or `--PT-`)
- Notes stay language-independent (no language prefix)

### Key Design Decisions

1. **Book entity lives in `graph.json`, not the book folder.** The book folder holds the book's *contents*, not the book entity itself. This way `graph.json` is a complete picture of top-level structure.

2. **`contains` edges live with the child entity's file.** If the child is in `EN-content.json`, the `contains` edge from the parent is also in `EN-content.json`. This keeps the hierarchy self-contained within files — you can validate a sub-file independently.

3. **Non-contains (annotation/semantic) relations live in `notes.json`.** All `note`, `theme`, `symbol`, `allusion`, `definition`, `meaning`, `reference` relations are authored in `notes.json`. This is the source of truth.

4. **Derived relations summarize annotations into `graph.json`.** The import script walks sub-files and creates computed edges from the book entity to concepts. These have `metadata.derived: true`. The app never creates or deletes them — only the import script does.

5. **Chapter files contain only `contains` relations.** They have entities + `contains` edges. No annotations. This keeps chapter files simple and fast to load.

### Derived Relations

Relations that summarize internal content on the book entity are computed from sub-files, not authored. They are flagged with `metadata.derived = true`.

**Order of operations in the import script (idempotent):**

```
1. For the book, delete all relations in graph.json where:
     metadata.derived === true
     AND (source OR target belongs to this book)

2. Write primary data to sub-files (EN-c1.json, notes.json, …)

3. Walk sub-files:
     For each non-contains relation R:
       if R.target is outside the book's subtree:
         create relation {
           source: bookId,
           target: R.target,
           type: R.type,
           metadata: { derived: true }
         }

4. Write graph.json with primary + derived relations merged
```

### Query-time behavior

```typescript
getDerivedRelations(state, entityId): Relation[]
  → filters by metadata.derived === true

getAllRelations(state, entityId): Relation[]
  → direct + derived
```

- Top-level graph shows derived edges without loading sub-files
- When sub-files are loaded, both the internal edge (notes-007 → concept) and the derived edge (book → concept) coexist — harmless
- When sub-files are unloaded, derived edges remain (they're in graph.json)

### Manifest Schema

```json
{
  "version": 1,
  "main": "graph.json",
  "collections": {
    "lord-of-the-flies--william-golding": {
      "type": "book",
      "content": {
        "EN": "lord-of-the-flies--william-golding/EN-content.json"
      },
      "chapters": {
        "1": "lord-of-the-flies--william-golding/EN-c1.json",
        "2": "lord-of-the-flies--william-golding/EN-c2.json",
        "3": "lord-of-the-flies--william-golding/EN-c3.json"
      },
      "notes": "lord-of-the-flies--william-golding/notes.json"
    }
  }
}
```

### `graph.json` (base layer)

```json
{
  "version": 5,
  "entities": [
    // Authors, books, concepts, geography — all top-level entities
    // Book entities ARE here (e.g. lord-of-the-flies--william-golding)
    // but their internal content (chapters, segments) is NOT
  ],
  "relations": [
    // Primary edges: type, author, year, language, format, setting
    // Geography contains edges (country→state→city)
    // Derived edges: note, theme, symbol, allusion, reference
    //   with metadata: { derived: true }
  ],
  "canvas": { "viewport": { ... }, "dimensions": {} }
}
```

### Sub-file format

Each sub-file is a valid `GraphSnapshot`:

```json
{
  "version": 5,
  "entities": [ ... ],
  "relations": [ ... ],
  "canvas": { "viewport": { "x": 0, "y": 0, "zoom": 1 }, "dimensions": {} }
}
```

- `EN-c{N}.json`: chapter container + all segments + contains edges (chapter → segments)
- `EN-content.json`: content container + frontmatter + contains edges (book→content, content→chapters)
- `notes.json`: notes container + note entities + contains edges (book→notes, notes→notes-*) + annotation edges

---

## Store Design

### State additions

```typescript
manifest: Manifest | null
loadedCollections: Record<string, LoadedCollection>

type LoadedCollection = {
  entityIds: Set<string>
  relationIds: Set<string>
}
```

### New actions

```typescript
loadBookContent(bookId: string)
  → looks up bookId in manifest.collections
  → reads each sub-file from adapter
  → merges entities/relations into store (skip duplicates by ID)
  → records added IDs in loadedCollections[bookId]
  → idempotent: calling twice for the same book is a no-op

unloadBookContent(bookId: string)
  → looks up recorded IDs in loadedCollections[bookId]
  → removes those entities and relations from store arrays
  → clears loadedCollections[bookId]

isBookLoaded(bookId: string): boolean
  → true if bookId is in loadedCollections
```

### Single-file fallback

When `manifest === null` (no manifest found), the store works as before — all entities are pre-loaded from `graph.json`. `loadBookContent` and `unloadBookContent` are no-ops.

---

## What Changes in Each File

| File | Change |
|---|---|
| `src/types/graph.ts` | Add `Manifest`, `BookCollection`, `LoadedCollection` types |
| `src/store/persistence/FSAdapter.ts` | Add `loadManifest()`, `loadSubFile()` methods; update `open()` to read manifest |
| `src/store/persistence/types.ts` | Optionally extend adapter interface |
| `src/store/useGraphStore.ts` | Add `manifest`, `loadedCollections`, actions |
| `src/engine/queries.ts` | Add `getDerivedRelations()`, `getAllRelations()` |
| `src/components/chrome/TextView.tsx` | Load/unload book content on column open/close |
| `scripts/migrate-to-multi-file.ts` | New — split graph.json into multi-file format |

---

## Implementation Steps

Each step is one agent session. Steps are sequential — each builds on the previous.

### Step 1: Foundation Types

**Goal**: Define the multi-file format types. Pure type additions — zero runtime impact.

**Files**: `src/types/graph.ts`

**Types to define**:
```ts
type Manifest = {
  version: 1
  main: string
  collections: Record<string, ManifestCollection>
}

type ManifestCollection = {
  type: "book"
  content: Record<string, string>
  chapters: Record<string, string>
  notes: string
}

type LoadedCollection = {
  entityIds: Set<string>
  relationIds: Set<string>
}
```

**Verify**: `npx tsc --noEmit`

---

### Step 2: FSAdapter — Manifest Reading + Sub-File Support

**Goal**: FSAdapter can read `manifest.json` and individual sub-files from a workspace folder.

**Files**: `src/store/persistence/FSAdapter.ts`

**What to do**:
- Add `loadManifest(dirHandle) → Promise<Manifest | null>` — reads `manifest.json`, returns null if no manifest (single-file workspace)
- Add `loadSubFile(dirHandle, relativePath) → Promise<GraphSnapshot>` — reads and validates a sub-file via `validateSnapshot()`
- Sub-files are valid `GraphSnapshot` documents
- Handle the case where no manifest exists — everything works as single-file (current behavior preserved)
- Add unit tests for manifest parsing and sub-file loading

**Verify**:
- `npx vitest run src/store/persistence/FSAdapter.test.ts`
- `npx tsc --noEmit`

---

### Step 3: Store — Lazy Loading State

**Goal**: The Zustand store can load and unload book content on demand.

**Files**: `src/store/useGraphStore.ts`

**What to do**:
- Add `manifest: Manifest | null` to store state
- Add `loadedCollections: Record<string, LoadedCollection>` to store state
- Add `loadBookContent(bookId: string)` action:
  1. Look up bookId in `manifest.collections`
  2. For each sub-file path, call adapter's `loadSubFile()`
  3. Merge entities and relations into store arrays (skip duplicates by ID)
  4. Record loaded IDs in `loadedCollections[bookId]`
- Add `unloadBookContent(bookId: string)` action:
  1. Look up recorded IDs in `loadedCollections[bookId]`
  2. Remove those entities and relations from store arrays
  3. Remove the `loadedCollections` entry
- Add `isBookLoaded(bookId: string): boolean` selector
- Single-file mode: when `manifest === null`, everything is pre-loaded
- Add unit tests for load/unload with mocked adapter

**Edge cases**:
- `loadBookContent` is idempotent — calling twice for the same book is a no-op
- Unloading removes entities/relations but does NOT delete content docs
- Base `graph.json` entities always remain in the store

**Verify**:
- `npx vitest run`
- Existing text-view and canvas still work with single-file data
- `npx tsc --noEmit`
- `npm run build`

---

### Step 4: Migration Script

**Goal**: Convert `hello2/graph.json` into the multi-file format. Output to `hello2-multi/`.

**Files**: New `scripts/migrate-to-multi-file.ts`

**What to do**:
- Read `hello2/graph.json`
- Identify all book entities
- For each book, trace `contains` edges to determine entity ownership:
  - Book entity → stays in base `graph.json`
  - `content-EN` (or `content`) container + frontmatter → `EN-content.json`
  - Chapter containers (`c1`, `c2`, ...) + chapter segments → `EN-c{N}.json`
  - Notes container + note entities + annotation relations → `notes.json`
- Split `contains` edges:
  - book → content, book → notes → in sub-files (with the child entity)
  - content → chapters → in `EN-content.json`
  - chapter → segments → in `EN-c{N}.json`
  - notes_container → notes → in `notes.json`
- Non-annotation edges (type, author, year, language, format, setting) → stay in `graph.json`
- Annotation edges (note, theme, symbol, allusion, definition, meaning, reference) → in `notes.json`
- Write `manifest.json` with the collections map
- Write base `graph.json` with top-level entities + primary edges
- Keep canvasData on all entities
- Write canvas state to `graph.json`
- Validate: JSON validity + referential integrity (cross-file)
- Preserve original `hello2/graph.json` — output to new directory

**ID migration**: If existing IDs use `--content` (no language prefix), migrate to `--content-EN` when writing sub-files. Update `contains` edge targets accordingly.

**Verify**:
- `python3 -c "import json; json.load(open('hello2-multi/graph.json')); print('Valid')"` for every file
- Referential integrity: every source/target exists as an entity ID
- Entity count matches original
- Relation count matches original

---

### Step 5: Derived Relations

**Goal**: Book-level `graph.json` shows annotation connections without loading chapters.

**Files**: `src/engine/queries.ts`, `scripts/migrate-to-multi-file.ts`

**What to do**:
- Add `getDerivedRelations(state, entityId)` to query engine:
  - Filters relations where `metadata.derived === true` and source or target matches entityId
- Add `getAllRelations(state, entityId)`:
  - Merges direct relations (via `getRelations`) + derived relations
- Update migration script to compute derived relations:
  1. For each book, walk sub-files (chapters, notes)
  2. Collect all non-contains relations from `notes.json`
  3. For each relation R where R.target is outside the book subtree (e.g., a concept):
     - Create: `source: bookId, target: R.target, type: R.type, metadata: { derived: true }`
  4. Append these derived relations to base `graph.json`
- Add unit tests for `getDerivedRelations` and `getAllRelations`

**Key rules**:
- Derived relations use the same `type` as the original (e.g., `theme`, `symbol`)
- `metadata.derived: true` is the only way to distinguish them
- Import script is the SOLE writer — app never creates or deletes derived relations
- Query functions are pure (no store dependency)

**Verify**:
- Unit tests for query functions
- Migration output: inspect `graph.json` for `metadata.derived: true` relations
- `npx tsc --noEmit`

---

### Step 6: Text-View Integration

**Goal**: Text-view lazy-loads book content when opening columns.

**Files**: `src/components/chrome/TextView.tsx`, `src/components/chrome/WorkspaceTree.tsx`

**What to do**:
- In `TextView`, when `openContainers` changes, for each newly opened container:
  - Resolve which book it belongs to (check ID prefix, or walk `contains` from base entities)
  - Call `useGraphStore.getState().loadBookContent(bookId)` if not loaded
- When a column is removed from `openContainers`:
  - If no other open column belongs to the same book, call `unloadBookContent(bookId)`
- `EntityTreeNode` continues to work unchanged — reads from merged store
- `WorkspaceTree` shows book hierarchies when books are loaded
- Handle single-file mode: `loadBookContent` is a no-op

**Edge cases**:
- User opens multiple columns from the same book → load once, unload when last closes
- User switches to canvas and back → books stay loaded (no unload on view switch)

**Verify**:
- Open `hello2-multi/` → text-view shows books in tree
- Click a book → columns open with chapters and segments
- Click a chapter → segments render
- Close column → content unloads (entity count drops in store)
- `npx tsc --noEmit`
- `npm run build`

---

### Step 7: Save Orchestration

**Goal**: Edits to sub-file content persist correctly back to disk.

**Files**: `src/store/useGraphStore.ts`, `src/store/persistence/FSAdapter.ts`

**What to do**:
- Add `saveSubFile(dirHandle, relativePath, snapshot)` to FSAdapter
- Track per-file dirty state in the store:
  - `dirtySubFiles: Set<string>` — which sub-file paths have been modified
  - On `addEntity`/`updateEntity`/`addRelation`/etc., mark the sub-file dirty if the entity/relation belongs to a loaded collection
  - On `loadBookContent`, reset dirty for those files
- Update `saveToDisk()`:
  1. Save base `graph.json` (always, for primary edge changes)
  2. For each dirty sub-file, save the subset of entities/relations belonging to that file
  3. Clear dirty flags on successful save
- `isDirty` checks both base graph changes AND dirty sub-files

**Key design decisions**:
- Saving a sub-file writes only the entities and relations that "belong" to that file (tracked via `loadedCollections`)
- Derived relations are NEVER written by the app
- Handle the edge case: if a book is unloaded while dirty, auto-save before unloading (or warn)

**Verify**:
- Edit a chapter segment, save, reload folder → change persists
- Edit a note, save, reload → change persists
- Add a new segment to a chapter, save, reload → segment appears
- `npx vitest run`
- `npx tsc --noEmit`

---

## Future Steps (Not in This Sequence)

- **m8 Part 1: Store Decomposition** — split `useGraphStore.ts` into Zustand slices (entities, relations, canvas, persistence, history)
- **m8 Part 2: Workspace Data Separation** — canvas positions → `workspace-data.json`, separate from domain data
- **Expand/Collapse in VizTest1** — D3 graph shows sub-collection toggle, loads book content on expand

---

## Dependency Graph

```
Step 1 (Types)
  ├── Step 2 (FSAdapter)
  │     └── Step 3 (Store)
  │           └── Step 6 (Text-View)
  │                 └── Step 7 (Save)
  └── Step 4 (Migration)
        └── Step 5 (Derived Relations)
              └── Step 6 (Text-View) [needs both branches]
```

Steps 2+3 (infrastructure) and 4+5 (data pipeline) can run in parallel after step 1. Step 6 needs both branches. Step 7 depends on step 6.

**Sequential execution**: 1 → 2 → 3 → 4 → 5 → 6 → 7.

---

## Related Documents

- `new-graph-plan.md` — **deprecated**, superseded by this document
- `dev-docs/plans/m8-decompose-and-data-separate.md` — store decomposition and canvas.json separation
- `dev-docs/graph-import-patterns.md` — chapter import reference
- `dev-docs/architecture.md` — system architecture
- `AGENTS.md` — top-level conventions
