# PRD0005 — Full Text Import (Hamlet)

## Status
Draft — implement after PRD0004 (reading viewport)

## Problem

The current seed data has 6 entities — enough to validate the schema, but not enough to validate the reading experience. The reading viewport (PRD0004) needs real content at scale to test:
- Navigation fluidity across hundreds of sequential entities
- localStorage persistence with realistic data volumes (~800 entities + relations)
- Rendering performance with real text content
- Whether the entity granularity model works for actual plays

Project Gutenberg's HTML for Hamlet is ideal because it already encodes the document hierarchy (acts, scenes, speeches, stage directions) as structured HTML elements.

## Goal

Build a build-time import script that parses the Gutenberg HTML and generates a JSON snapshot of the full play. The app loads this as seed data on first run, replacing the small excerpts.

## Scope

**In scope:**
- Node.js import script at `scripts/import-gutenberg.ts`
- Parses the Gutenberg HTML into entities and relations
- Entity types: Acts (container), Scenes (container), Speeches (segment with metadata.character), Stage directions (segment with metadata.type)
- Relations: contains (Act→Scene, Scene→segment), next (document-order chain)
- Output: `src/data/hamlet.json` versioned snapshot file
- App integration: load full Hamlet on first run (empty localStorage), retain current excerpts as fallback
- Scale: ~775 entities + ~800 relations

**Out of scope:**
- Importing arbitrary Gutenberg texts (single-text script for now)
- Runtime HTML parsing (build-time only)
- Multiple translations or editions
- EPUB/PDF import pipeline (far future)
- Intelligent paragraph merging or semantic splitting

## Design

### 1. HTML structure (Gutenberg)

Gutenberg's Hamlet HTML has a predictable structure:

```html
<div class="chapter">
  <h2>HAMLET</h2>
  ...
  <h3>ACT I</h3>
  ...
  <h4>SCENE I. Elsinore. A platform before the castle.</h4>

  <p class="stage-direction">
    <i>FRANCISCO at his post. Enter to him BERNARDO.</i>
  </p>

  <p>
    <span class="charname">BERNARDO.</span>
    Who's there?
  </p>

  <p>
    <span class="charname">FRANCISCO.</span>
    Nay, answer me: stand, and unfold yourself.
  </p>
  ...
</div>
```

Key patterns to detect:
- `<h3>` text starting with "ACT" → Act boundary
- `<h4>` text starting with "SCENE" → Scene boundary
- `<p class="stage-direction">` or `<p><i>...</i></p>` → Stage direction
- `<p>` containing `<span class="charname">` → Speech with character
- All other `<p>` → continuation of previous speech or orphan text

### 2. Entity mapping

| HTML element | Entity kind | Entity title | Content | Metadata |
|-------------|-------------|-------------|---------|----------|
| `<h3>ACT I</h3>` | `container` | "Act I" | "" | `{ type: "act" }` |
| `<h4>SCENE I...</h4>` | `container` | "Scene I — Elsinore..." | "Elsinore. A platform..." | `{ type: "scene" }` |
| `<p class="stage-direction">` | `segment` | (empty) | "FRANCISCO at his post..." | `{ type: "stage-direction" }` |
| `<p><span>BERNARDO.</span>Who's there?</p>` | `segment` | "BERNARDO" | "Who's there?" | `{ character: "Bernardo" }` |

### 3. Relations

- Each speech/segment has a `next` relation pointing to the following segment
- Each Scene has a `contains` relation for every segment inside it
- Each Act has a `contains` relation for every Scene inside it

This creates a flat sequential chain for reading navigation, plus a hierarchical tree for outline/overview.

### 4. Script design

```ts
// scripts/import-gutenberg.ts

// Reads input HTML, walks the DOM, emits entities + relations.
// Usage: npx tsx scripts/import-gutenberg.ts < input.html > src/data/hamlet.json
```

The script runs via `npx tsx` (no build step needed — TypeScript executed directly).

Events emitted by the parser:
1. `act:start` (title, index) → creates container entity
2. `scene:start` (title, location) → creates container entity, contains→act
3. `speech` (character, text) → creates segment entity
4. `stage-direction` (text) → creates segment entity with metadata flag

Each event emits `addEntity` + `addRelation` calls into an accumulator. At the end, the accumulator is serialized to JSON.

### 5. App integration

The snapshot file is loaded during store initialization. On first run (empty `localStorage`), the store hydrates from the full Hamlet snapshot instead of the small excerpts. This means a fresh user sees the complete play.

```ts
// Updated loadInitialState()
function loadInitialState() {
  const stored = readLocalStorage()
  if (stored) return stored
  return { entities: hamletEntities, relations: hamletRelations }  // full play
}
```

The small seed excerpts are retained as a compile-time fallback (if the snapshot file doesn't exist or fails to load).

## File Changes

| File | Action |
|------|--------|
| `scripts/import-gutenberg.ts` | Create — HTML parser + entity/relation emitter |
| `src/data/hamlet.json` | Create — generated snapshot (gitignored or committed) |
| `src/data/hamlet.ts` | Create — typed export of parsed data as TS module (alternative to JSON) |
| `src/store/useGraphStore.ts` | Update — load full Hamlet on first run |
| `package.json` | Update — add `import:hamlet` script command |

## Implementation Steps

### Step 1 — Download and inspect the Gutenberg HTML

Place the raw HTML at `scripts/hamlet.html` for parsing.

### Step 2 — Write the import script

Create `scripts/import-gutenberg.ts`:
- Read HTML from stdin
- Walk DOM elements in document order
- Parse headings, speeches, stage directions
- Accumulate entities and relations
- Emit JSON to stdout

### Step 3 — Generate the snapshot

```sh
npx tsx scripts/import-gutenberg.ts < scripts/hamlet.html > src/data/hamlet.json
```

Verify the output: count entities, check a few speeches, validate relation chains.

### Step 4 — Wire into the app

Update `src/store/useGraphStore.ts`:
- Add fallback: try importing `src/data/hamlet.json`; if unavailable, use current seed excerpts
- First-run detection: if `localStorage` is empty, hydrate from full play

### Step 5 — Verify

- Fresh load → full Hamlet is present in the store
- ~775 entities + ~800 relations render on the canvas
- Reading viewport (PRD0004) navigates fluidly through acts
- localStorage persistence works at scale (save/refresh/restore)
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. Import script produces a valid JSON snapshot with correct entity/relation structure
2. Snapshot contains all 5 acts, ~20 scenes, ~700+ speeches, ~50 stage directions
3. `next` chains are continuous and in the correct document order
4. `contains` relations correctly map Act→Scene→segments
5. Metadata correctly tags speeches (character name) and stage directions (type)
6. Fresh app load shows full Hamlet (not just excerpts)
7. App compiles with the snapshot data included
8. `npx tsc --noEmit` passes
9. `npm run build` succeeds

## Verification

```sh
npx tsx scripts/import-gutenberg.ts < scripts/hamlet.html > src/data/hamlet.json
npx tsc --noEmit
npm run build
npm run dev   # manual: full play in reading viewport
```
