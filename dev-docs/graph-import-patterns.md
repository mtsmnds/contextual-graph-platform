# Graph Import Patterns

Reference for importing book content into a `GraphSnapshot` (version 5) JSON file.

---

## 1. Graph Model Reference

### Core Types (`src/types/graph.ts`)

```ts
type EntityType = "segment" | "container" | "annotation" | "concept" | "summary"

type Entity = {
  id: string
  type: EntityType
  content: string
  metadata: Record<string, unknown>
  createdAt: number   // Date.now() epoch ms
  updatedAt: number   // same as createdAt for batch imports
  canvasData: CanvasData
}

type Relation = {
  id: string
  source: string       // entity id
  target: string       // entity id
  type: string         // "contains" | "note" | "theme" | "symbol" | ...
  sortOrder: string    // fractional-indexing key from generateNKeysBetween()
  metadata: Record<string, unknown>
}

type GraphSnapshot = {
  version: 5
  entities: Entity[]
  relations: Relation[]
  canvas: CanvasState  // { viewport: { x, y, zoom }, dimensions: {} }
}
```

### Entity Types in Practice

| Type | Used for |
|---|---|
| `container` | Books, content containers, chapter folders, note collections, word containers |
| `concept` | Thematic nodes (`violence`, `weak-vs-strong`, `civilization`, `garden-of-eden`, `adults`, `nuclear-war`, `lit-device--foreshadowing`), facet values (`type--book`, `gender--male`, `year--1954`), geography nodes (`country--england`, `city--athens`) |
| `segment` | Content leaves (dialogue lines), note bodies, word definitions |

### Relation Types Used in Annotations

| Type | Direction | Meaning |
|---|---|---|
| `contains` | parent → child | Hierarchy (book → content-EN → chapter; notes container → note) |
| `note` | segment → note entity | General annotation linking a text passage to a note |
| `theme` | note → concept | Thematic concept the note discusses |
| `symbol` | segment → note / note → concept | Symbolic meaning (conch as symbol, glasses as vulnerability) |
| `allusion` | segment → note / note → concept | Literary/Biblical allusion |
| `definition` | segment → word definition | Word defined at this passage |
| `meaning` | segment → note | Clarification of a word's meaning in context |
| `reference` | note → concept | Note references a concept (singular — **never** `references`) |

---

## 2. ID Conventions

### Book Content

```
Book:                  {slug}--{author-slug}
                         → lord-of-the-flies--william-golding

Content container:     {book-id}--content-EN
                         → lord-of-the-flies--william-golding--content-EN

Chapter:               {book-id}--c{1..N}
                         → lord-of-the-flies--william-golding--c1

Segment:               {book-id}--c{N}-{NNN}
                         → lord-of-the-flies--william-golding--c1-001

Title segment:         {book-id}--c{N}-title
                         → lord-of-the-flies--william-golding--c1-title

Subtitle segment:      {book-id}--c{N}-subtitle
                         → lord-of-the-flies--william-golding--c1-subtitle

Notes container:       {book-id}--notes
                         → lord-of-the-flies--william-golding--notes

Note entity:           {book-id}--notes-{NNN}
                         → lord-of-the-flies--william-golding--notes-001

Descriptive note:      {book-id}--notes--{slug}
                         → lord-of-the-flies--william-golding--notes--the-scar
```

### Words

```
Word container:        word--{lemma}
                         → word--proffer

Word definition:       word--{lemma}-{NNN}
                         → word--proffer-001
```

### Concepts

```
Thematic concept:      {kebab-case-slug}
                         → violence, weak-vs-strong, civilization, adults

Facet concept:         {key}--{value}
                         → type--book, year--1954, language--english, format--novel

Geography concept:     {level}--{name}
                         → country--england, state--england, city--stratford-upon-avon

Literary device:       lit-device--{name}
                         → lit-device--foreshadowing
```

Rule: entities that logically belong to a book get the `book-id--` prefix. Concepts and words are top-level (no book prefix).

---

## 3. Concept Entities

Concepts are created on demand when a note needs a `theme`, `symbol`, `allusion`, or `reference` edge. They have no `contains` parent — they float at the top level.

```json
{
  "id": "weak-vs-strong",
  "type": "concept",
  "content": "Weak vs Strong",
  "metadata": {},
  "createdAt": 1780690020000,
  "updatedAt": 1780690020000,
  "canvasData": { "x": 0, "y": 0, "width": 208, "height": 64 }
}
```

Pattern: notes link to concepts, not segments directly:

```
notes-007 ── theme ──▶ weak-vs-strong
notes-007 ── theme ──▶ loss-of-innocence
notes-012 ── reference ──▶ nuclear-war
notes-012 ── reference ──▶ lit-device--foreshadowing
notes-006 ── allusion ──▶ garden-of-eden
```

---

## 4. canvasData Defaults

All batch-imported entities start at position `(0, 0)`. Dimensions vary by entity type:

| Entity type | width | height |
|---|---|---|
| `container` (chapter, content-EN, notes) | 416 | 64 |
| `segment` (content line, note body) | 416 | 64 |
| `concept` | 208 | 64 |
| `container` (word) | 208 | 64 |
| `segment` (word definition) | 416 | 64 |

```json
"canvasData": { "x": 0, "y": 0, "width": 416, "height": 64 }
```

---

## 5. Source HTML Preparation

### Input format
Calibre-split HTML files. Each file contains one chapter body in a single `<body>` line.
( Can happen to be other type of html files as well, not only `calibre` )

### Strip
- Calibre class attributes (`class="calibreX"`, `class="mwX"`, etc.)
- `<a>` navigation anchors (but keep linked text)
- Spacer `<p>` elements (empty paragraphs)
- Named HTML entities that obscure the text

### Convert
- `<i>text</i>` → `_text_`
- `<b>text</b>` → `**text**`

### Headings
- `#` heading → reserved for the book title (used in frontmatter, not chapter content)
- `## heading` → chapter title (e.g. `## **_CHAPTER ONE_**`)
- `### heading` → chapter subtitle (e.g. `### _The Sound of the Shell_`)

---

## 6. Chapter Import Recipe

### Step 1: Create the chapter container

```json
{
  "id": "lord-of-the-flies--william-golding--c1",
  "type": "container",
  "content": "Chapter 1",
  "metadata": { "type": "chapter" },
  "createdAt": 1780690020000,
  "updatedAt": 1780690020000,
  "canvasData": { "x": 0, "y": 0, "width": 416, "height": 64 }
}
```

### Step 2: Add `contains` edge from content-EN

The `sortOrder` must be generated with `generateKeyBetween` or `generateNKeysBetween` — never hardcoded as bare numbers.

```json
{
  "id": "r_lotf_content_to_c1",
  "source": "lord-of-the-flies--william-golding--content-EN",
  "target": "lord-of-the-flies--william-golding--c1",
  "type": "contains",
  "sortOrder": "a1",
  "metadata": {}
}
```

### Step 3: Parse the chapter into segments

- Title line → segment `c1-title` (no `line` metadata)
- Subtitle line → segment `c1-subtitle` (no `line` metadata)
- Each paragraph of body text → segment `c1-NNN` (with `line` metadata as three-digit string)

Segment metadata for content lines:
```json
"metadata": { "line": "001" }
```

### Step 4: Create `contains` edges

Each segment gets a `contains` edge from the chapter container. Generate all sortOrder keys at once:

```ts
import { generateNKeysBetween } from "fractional-indexing-jittered"
const keys = generateNKeysBetween(null, null, segmentCount)
```

Then assign one key per segment:

```json
{ "id": "r_lotf_c1_to_001", "source": "...--c1", "target": "...--c1-001", "type": "contains", "sortOrder": "a0" }
{ "id": "r_lotf_c1_to_002", "source": "...--c1", "target": "...--c1-002", "type": "contains", "sortOrder": "a1" }
```

**Never use bare `a0`–`a{N}` numbering** — it breaks lexicographically above 9 items.

### Step 5: Insert into the GraphSnapshot

Add all new entities to `entities[]` and all new relations to `relations[]`.

### Step 6: Validate

```sh
python3 -c "import json; json.load(open('hello2/graph.json')); print('Valid')"
```

Also verify referential integrity: every `source` and `target` in relations must exist as an `id` in entities.

---

## 7. Annotation Patterns (Notes)

### Note Entity

```json
{
  "id": "lord-of-the-flies--william-golding--notes-001",
  "type": "segment",
  "content": "Analysis text here...",
  "metadata": {},
  "createdAt": 1780690020000,
  "updatedAt": 1780690020000,
  "canvasData": { "x": 0, "y": 0, "width": 416, "height": 64 }
}
```

### Always add a `contains` edge from the notes container

```json
{
  "id": "r_lotf_notes_to_001",
  "source": "lord-of-the-flies--william-golding--notes",
  "target": "lord-of-the-flies--william-golding--notes-001",
  "type": "contains",
  "sortOrder": "a2",  // generated via generateNKeysBetween — never bare numbers
  "metadata": {}
}
```

Notes sortOrders are generated via `generateNKeysBetween(null, null, noteCount)`.

### Multi-edge patterns

- **Multiple segments → one note:** e.g. both `c1-314` and `c1-315` point to `notes-029` via `note` edges
- **One segment → multiple notes:** e.g. `c1-201` has both a `note` edge to `notes-021` and another `note` edge to `notes-024`
- **One note → multiple concepts:** e.g. `notes-006` has `allusion` edges to `garden-of-eden`, `adam`, `satan`, `the-serpent`
- **One segment → one note + one definition:** e.g. `c1-129` has a `note` edge to `notes-014` and a `definition` edge to `word--ill-omen-001`

### Relation Type Glossary

| Type | Example |
|---|---|
| `note` | `c1-005 ── note ──▶ notes-002` — general annotation |
| `meaning` | `c1-179 ── meaning ──▶ notes-017` — clarifies a word in context |
| `symbol` | `c1-151 ── symbol ──▶ notes-015` — symbolic reading of a passage |
| `allusion` | `c1-357 ── allusion ──▶ notes-030` — literary/Biblical reference |
| `definition` | `c1-313 ── definition ──▶ word--imurred-001` — word lookup |
| `theme` | `notes-007 ── theme ──▶ weak-vs-strong` — thematic connection |
| `reference` | `notes-012 ── reference ──▶ nuclear-war` — note references a concept |

`reference` is always singular. Never use `references`.

---

## Sort Order (Fractional-Indexing)

The `fractional-indexing-jittered` package (installed in `react-roadmap/node_modules/`) generates keys that sort lexicographically correctly and allow insertion between any two existing keys.

### API

| Function | Use case |
|---|---|
| `generateNKeysBetween(null, null, count)` | Batch import — produces `count` evenly-spaced keys |
| `generateKeyBetween(prev, null)` | Append after the last child |
| `generateKeyBetween(prev, next)` | Insert between two children |

### Batch import example

```ts
import { generateNKeysBetween } from "fractional-indexing-jittered"

const count = 388  // e.g. number of segments in a chapter
const keys = generateNKeysBetween(null, null, count)
// → ['a0', 'a1', ..., 'a9', 'aA', 'aB', ..., 'aZ', 'a10', ...]
// Lexicographic order: a0 < a1 < ... < a9 < aA < aB < ... < aZ < a10 < a11
```

### Key rules

- Base-62 digits: `0-9` < `A-Z` < `a-z`
- Never use bare `a0`–`a{N}` — works for ≤9 items but breaks at `a10` (sorts before `a2`)
- Generate via the library, not by hand
- One-liner for manual JSON edits:
  ```sh
  node -e "import('fractional-indexing-jittered').then(m => console.log(m.generateKeyBetween('aB', 'aC')))"
  ```

---

## 8. Word Definition Pattern

Two entities per word:

### Word container

```json
{
  "id": "word--ill-omen",
  "type": "container",
  "content": "ill-omen",
  "metadata": { "type": "word" },
  "createdAt": 1780690020002,
  "updatedAt": 1780690020002,
  "canvasData": { "x": 0, "y": 0, "width": 208, "height": 64 }
}
```

### Definition segment

```json
{
  "id": "word--ill-omen-001",
  "type": "segment",
  "content": "Mau presságio, Agouro. Marked by the belief to portend a bad future event.",
  "metadata": { "type": "definition" },
  "createdAt": 1780690020003,
  "updatedAt": 1780690020003,
  "canvasData": { "x": 0, "y": 0, "width": 416, "height": 64 }
}
```

### Two relations

```json
{ "id": "r_ill_omen_def_c1_129",  "source": "...--c1-129", "target": "word--ill-omen-001", "type": "definition", "sortOrder": "a0", "metadata": {} }
{ "id": "r_ill_omen_contains_001", "source": "word--ill-omen",  "target": "word--ill-omen-001", "type": "contains",    "sortOrder": "a0", "metadata": {} }
```

Single-relation edges (`definition`, `note`, `meaning`, etc.) use `"a0"` as a placeholder since they don't need ordering among siblings.

---

## 9. Relation ID Conventions

| Pattern | Used for | Example |
|---|---|---|
| `r_lotf_notes_to_{NNN}` | notes container contains → note | `r_lotf_notes_to_001` |
| `r_lotf_c1{NNN}_to_notes{NNN}` | segment → note annotation | `r_lotf_c1001_to_notes001` |
| `r_lotf_book_to_content` | book → content-EN | `r_lotf_book_to_content` |
| `r_lotf_book_to_notes` | book → notes container | `r_lotf_book_to_notes` |
| `r_lotf_content_to_c{N}` | content-EN → chapter | `r_lotf_content_to_c1` |
| `r_lotf_c{N}_to_{NNN}` | chapter → segment | `r_lotf_c1_to_001` |
| `r_{word}_def_c1{NNN}` | segment → word definition | `r_ill_omen_def_c1_129` |
| `r_{word}_contains_001` | word container → definition | `r_ill_omen_contains_001` |
| `r_note{NNN}_theme_{concept}` | note → concept (theme) | `r_note007_theme_weak-vs-strong` |
| `r_note{NNN}_reference_{concept}` | note → concept (reference) | `r_note012_reference_nuclear_war` |
| `r_note{NNN}_allusion_{concept}` | note → concept (allusion) | `r_note006_allusion_eden` |
| `r_lotf_c1{NNN}_to_the_scar` | segment → descriptive note | `r_lotf_c1001_to_the_scar` |

---

## 10. Required Fields Checklist

### Entity

| Field | Required | Value |
|---|---|---|
| `id` | ✓ | unique string per ID convention |
| `type` | ✓ | `"container"` / `"segment"` / `"concept"` |
| `content` | ✓ | display text |
| `metadata` | ✓ | `{}` or `{ "type": "word" }` / `{ "type": "definition" }` / `{ "line": "001" }` / `{ "type": "chapter" }` |
| `createdAt` | ✓ | `Date.now()` epoch ms (sequential within batch) |
| `updatedAt` | ✓ | same as `createdAt` for batch imports |
| `canvasData` | ✓ | `{ "x": 0, "y": 0, "width": 416, "height": 64 }` (or 208 width for concepts/word containers) |

### Relation

| Field | Required | Value |
|---|---|---|
| `id` | ✓ | unique string per naming convention |
| `source` | ✓ | must exist as an entity `id` |
| `target` | ✓ | must exist as an entity `id` |
| `type` | ✓ | `"contains"` / `"note"` / `"theme"` / `"symbol"` / `"allusion"` / `"definition"` / `"meaning"` / `"reference"` |
| `sortOrder` | ✓ | fractional-indexing key via `generateNKeysBetween()` — never bare `a0`–`a{N}` |
| `metadata` | ✓ | `{}` |

---

## 11. Validation

```sh
# Basic JSON validity
python3 -c "import json; json.load(open('hello2/graph.json')); print('Valid')"
```

Referential integrity check (Python):
```python
import json

data = json.load(open('hello2/graph.json'))
ids = {e['id'] for e in data['entities']}

for r in data['relations']:
    assert r['source'] in ids, f"Missing source: {r['source']}"
    assert r['target'] in ids, f"Missing target: {r['target']}"

print(f"OK — {len(data['entities'])} entities, {len(data['relations'])} relations")
```

---

## 12. Full Book Hierarchy Reference

Using Lord of the Flies as the canonical example. `contains` sortOrders are fractional-indexing keys generated via `generateNKeysBetween`:

```
lord-of-the-flies--william-golding                    [container: book]
  ├── contains ──▶ lord-of-the-flies--william-golding--content-EN  [container: content]
  │                     └── children ordered by fractional-indexing keys
  │                         (frontmatter, c1, c2, ..., c12)
  │
  ├── contains ──▶ lord-of-the-flies--william-golding--notes       [container: notes]
  │                     └── children ordered by fractional-indexing keys
  │                         (notes-001, notes--the-scar, ..., notes-NNN)
  │
  └── edges (type, author, year, language, format, setting)
```
