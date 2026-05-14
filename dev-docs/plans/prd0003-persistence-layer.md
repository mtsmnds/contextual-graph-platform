# PRD0003 — Persistence Layer

## Status
Draft — ready for implementation

## Problem

The graph store lives entirely in memory. Entities and relations created or modified during a session are lost on page refresh. There is no way to save progress or share graph state between sessions.

## Goal

Auto-save entities and relations to `localStorage` on every mutation. Load saved state on startup. Provide manual export/import as JSON files for backup and portability.

## Scope

**In scope:**
- Auto-save: serialize `entities` + `relations` to `localStorage` on every domain mutation
- Startup hydration: load saved state from `localStorage`; fall back to seed data if empty
- Debounced writes: batch rapid mutations into a single storage write
- Export action: serialize current entities + relations to a downloadable JSON file
- Import action: parse an uploaded JSON file and replace store state
- Save-only domain state: `ViewState` is not persisted (see design notes)

**Out of scope:**
- Migration system for schema changes (future)
- SQLite/Tauri storage (future)
- Cloud sync or remote storage (future)
- Undo/redo (future)
- Auto-save toggle or settings UI

## Design

### 1. Storage format

Single `localStorage` key: `"react-roadmap-graph"`

```json
{
  "version": 1,
  "entities": [ ... ],
  "relations": [ ... ]
}
```

A `version` field allows future schema migrations. Only domain state (`entities`, `relations`) is persisted — `ViewState` is transient UI state that should not survive refresh.

### 2. Startup hydration

In the store creator, attempt to read and parse `localStorage.getItem("react-roadmap-graph")` before falling back to seed data:

```ts
function loadInitialState(): { entities: Entity[]; relations: Relation[] } {
  try {
    const raw = localStorage.getItem("react-roadmap-graph");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 1 && Array.isArray(parsed.entities)) {
        return { entities: parsed.entities, relations: parsed.relations ?? [] };
      }
    }
  } catch { /* ignore corrupt data, fall through to seeds */ }
  return { entities: seedEntities, relations: seedRelations };
}
```

### 3. Auto-save subscription

Use Zustand's `subscribe` with a shallow selector on `entities` and `relations`. Debounce writes to avoid thrashing `localStorage` during rapid mutations (e.g., dragging a node that triggers position updates).

```ts
// In a useEffect or store setup
const unsub = useGraphStore.subscribe(
  (state) => ({ entities: state.entities, relations: state.relations }),
  (saved) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      localStorage.setItem("react-roadmap-graph", JSON.stringify({
        version: 1,
        entities: saved.entities,
        relations: saved.relations,
      }));
    }, 300);
  },
  { equalityFn: shallow },
);
```

300ms debounce is sufficient — it batches rapid mutations without feeling laggy.

### 4. Export action

Add to the store:

```ts
exportGraph: () => void
```

Implementation:

```ts
exportGraph: () => {
  const state = get();
  const blob = new Blob(
    [JSON.stringify({ version: 1, entities: state.entities, relations: state.relations }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `graph-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
},
```

### 5. Import action

Add to the store:

```ts
importGraph: (data: { entities: Entity[]; relations: Relation[] }) => void
```

Implementation:

```ts
importGraph: (data) => {
  set({ entities: data.entities, relations: data.relations });
},
```

The caller (UI) handles the file input — the store just accepts validated data. This keeps the store pure of DOM APIs.

### 6. File structure

```
src/
  utils/
    persistence.ts    # load/save/export helpers (or inline in store)
  store/
    useGraphStore.ts  # add hydration, auto-save subscribe, exportGraph, importGraph
```

The persistence logic could live in `src/utils/persistence.ts` for testability, or inline in the store for simplicity. Either is acceptable — a separate module is preferred for single-responsibility.

## File Changes

| File | Action |
|------|--------|
| `src/store/useGraphStore.ts` | Add hydration from localStorage, auto-save subscribe, `exportGraph`, `importGraph` |
| `src/utils/persistence.ts` | Create (optional — load/save helpers extracted from store) |
| `src/types/graph.ts` | Add `GraphSnapshot` type (versioned container for entities + relations) — optional |
| `dev-docs/requirements.md` | Update — add persistence user stories |

## Implementation Steps

### Step 1 — Add `GraphSnapshot` type to `src/types/graph.ts`

```ts
type GraphSnapshot = {
  version: number;
  entities: Entity[];
  relations: Relation[];
};
```

### Step 2 — Implement hydration and auto-save

Modify `src/store/useGraphStore.ts`:
- Replace direct seed data with `loadInitialState()` call
- Add `import { shallow } from "zustand/shallow"` for the subscribe selector
- Add `exportGraph` and `importGraph` actions to the store interface and implementation
- Set up auto-save subscribe after store creation

### Step 3 — Add export/import actions

- `exportGraph`: serialize + trigger download
- `importGraph`: validate + replace store state

### Step 4 — Verify

- Open app → seed data renders as before
- Modify state (e.g., add entity via console or temporary UI)
- Refresh page → modifications persist
- Navigate to a blank state, import a JSON file → state restores
- Export current state → downloaded JSON is valid and re-importable

## Acceptance Criteria

1. Entities and relations survive page refresh (test: add entity → refresh → still present)
2. Seed data appears on first-ever load (no prior localStorage state)
3. Corrupt localStorage data falls back to seed data gracefully (no crash)
4. Rapid mutations debounce into a single localStorage write (verify via DevTools > Application > Local Storage)
5. `exportGraph` downloads a valid JSON file containing all entities and relations
6. `importGraph` replaces store state with imported data
7. View state is NOT persisted (focusedEntityId, expandedPanels reset on refresh)
8. `npx tsc --noEmit` passes
9. `npm run build` succeeds

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: add entity, refresh, confirm persistence
```
