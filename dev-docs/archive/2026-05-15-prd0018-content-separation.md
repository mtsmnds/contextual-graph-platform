# PRD0018: Content Separation — Graph vs Document Store

**Status:** Complete

> **Completion note:** Implemented 2026-05-15. Entity metadata separated from document content. `getContent`/`saveContent`/`clearContent` added to store. Container IDs use `generateDocId()` (timestamp-based). Segment `content` field retained for hamlet legacy. ADR at `archive/2026-05-15-content-separation.md`.

---

## 1. Graph Design Analysis

Current model violates graph best practices:

| Principle | Current state | Problem |
|-----------|--------------|---------|
| **Nodes are lightweight** | Entity carries `content?: string` — can be a 100KB TipTap JSON blob | The graph becomes a content store. Loading 100 entities = loading 100 documents |
| **Content is separate from structure** | `graph.json` mixes document metadata with document bodies | Can't browse titles and relations without parsing every document |
| **Queryability** | `getEntity`, `getRelations` operate on the full entity list | Every query carries content payload whether needed or not |
| **Single responsibility** | Entity type has both structural fields (id, kind, title) and content fields | Ambiguous what an entity "is" — a document reference or a document? |

Proposed model:

```
┌──────────────────────────┐     ┌──────────────────────────────┐
│     graph.json           │     │  content/{id}.json           │
│                          │     │                              │
│  entities: [             │     │  { "type": "doc",            │
│    { id, kind, title,    │     │    "content": [              │
│      metadata }          │     │      { "type": "heading"... }│
│  ]                       │     │    ]                         │
│  relations: [            │     │  }                           │
│    { source, target,     │     │                              │
│      type, metadata }    │     │  One file per document       │
│  ]                       │     │  Raw TipTap JSON,            │
│                          │     │  not stringified             │
│  Lightweight, browsable  │     │  Loaded on demand            │
└──────────────────────────┘     └──────────────────────────────┘
```

## 2. What Changes

### 2.1 Entity type — `content` becomes segment-only (legacy)

```ts
// graph.ts
type Entity = {
  id: string
  kind: EntityKind
  title?: string
  content?: string    // kept ONLY for segment entities (hamlet legacy)
  metadata: Record<string, unknown>
}
```

Container entities never have `content` inline. Their document body lives in `content/{id}.json`.

### 2.2 Store — content cache + file operations

```ts
interface GraphStore {
  // ... existing fields (entities, relations, view, directoryHandle, etc.)

  // New: in-memory cache for container document contents
  contentLoaded: Set<string>               // entity IDs whose content is loaded
  getContent: (id: string) => Promise<Record<string, unknown> | null>
  saveContent: (id: string, data: Record<string, unknown>) => Promise<void>
}
```

- `getContent(id)` — checks `contentLoaded` Set; if not loaded, reads `content/{id}.json` from disk and caches it
- `saveContent(id, data)` — writes `content/{id}.json` to disk, updates cache
- Auto-save for `graph.json` unchanged (writes entities/relations without content)
- Content saves are triggered explicitly by the editor's `onSave` callback

### 2.3 File layout in the user's folder

```
hello2/
  graph.json         ← entities + relations (no content blobs)
  content/           ← created on first content save
    doc_1234567890.json
    doc_1234567891.json
```

The store creates `content/` if it doesn't exist on first `saveContent` call.

### 2.4 ID generation — timestamp-based for containers

Current: `slugify(title)` → `"untitled"` for every new page.

New: `doc_{Date.now()}` → `doc_1747350000000`.

Benefits:
- Stable across title changes
- Unique without checking collision
- No ordering dependency (don't need sibling count)
- Human-readable enough for debugging

```ts
// ids.ts
export function generateDocId(): string {
  return `doc_${Date.now()}`
}
```

### 2.5 ReadingViewport — load from content cache

```tsx
// Instead of: content={rootEntity?.content ?? ""}
// New:
const [docContent, setDocContent] = useState("")
useEffect(() => {
  getContent(focusedId).then((data) => {
    setDocContent(data ? JSON.stringify(data) : "")
  })
}, [focusedId])
```

For hamlet segments, `entity.content` is still read directly (legacy path).

### 2.6 TiptapEditor — explicit content save

```tsx
// onSave no longer calls updateEntity({ content: json })
// Instead, calls store.saveContent(entityId, JSON.parse(json))
```

## 3. Files Changed

| File | Change |
|------|--------|
| `src/types/graph.ts` | Keep `content?: string` but document as segment-only legacy |
| `src/store/useGraphStore.ts` | Add `contentLoaded`, `getContent`, `saveContent`. Remove content from entity mutation paths |
| `src/engine/ids.ts` | Add `generateDocId()` for timestamp-based container IDs |
| `src/components/AppSidebar.tsx` | `handleNewPage` uses `generateDocId()` |
| `src/components/HomePage.tsx` | Same — new page creation |
| `src/renderers/ReadingViewport.tsx` | Load container content from store cache instead of entity.content |
| `src/renderers/TiptapEditor.tsx` | `onSave` calls `saveContent` instead of `updateEntity` |

## 4. Out of Scope

- Hamlet migration to TipTap JSON (separate PRD)
- Database backend (SQLite, etc.) — File System Access API stays for now
- Removing `content` from Entity type entirely (wait until segments are migrated)
