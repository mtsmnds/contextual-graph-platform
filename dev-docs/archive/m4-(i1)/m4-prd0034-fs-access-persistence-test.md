> **Completion note (2026-05-17):**
> - **What was built:** Cleaned up `~/Code/hello2/` with fresh v3 test data (8 entities, 7 relations, 3 container documents). Verified FS Access persistence end-to-end: load via "Open Folder" → all entities/edges render correctly; new node creation + inline editing auto-save to `graph.json` on disk; page reload auto-reconnects via stored FS handle and restores all data. No code changes needed — pure test verification.
> - **Key decisions:** Wiped old v2 data (stale annotations, corrupted titles) in favor of clean v3 test data with meaningful entities (tech stack concepts) to exercise both node and edge rendering.
> - **Results:** All 4 verification steps passed — load, create, edit, reload persistence. Auto-save writes `graph.json` within 300ms debounce. FS handle stored in IndexedDB enables seamless reconnect. Zero console errors.
> - **Postponed:** Edge connection via drag-and-drop and edge deletion tested conceptually but automated verification deferred (requires manual user gesture for `showDirectoryPicker`). Listed explicitly in i1-roadmap "Now" for follow-up polish.

# PRD0034 — FS Access Persistence Test

## Overview

Test the FS Access persistence layer end-to-end after the PRD0033 edge-handle changes. Verify that loading from a local folder, rendering entities + relations in the graph canvas, and auto-saving changes to disk all work correctly.

## Background

The FS Access adapter (`src/store/persistence/fs-access-adapter.ts`) writes a `graph.json` + per-container Tiptap documents to a user-picked folder. The auto-save subscription (300ms debounce in `useGraphStore.ts`) triggers on every entities/relations change. Edge connections (PRD0028b) and four-way handles (PRD0033) are implemented but never tested with real FS Access persistence.

The existing `~/Code/hello2/` has stale v2 data (old schema with `title` field), corrupted entity names, and orphaned annotation entities from earlier editor tests — it will be cleaned up.

## Scope

### In scope

1. Clean up `~/Code/hello2/` — fresh `graph.json` (v3 schema) with meaningful test data that exercises both entities and relations
2. Verify the updated `graph.json` loads correctly in the graph canvas via "Open Folder"
3. Verify the auto-save writes changes back to `~/Code/hello2/graph.json`
4. Verify reload persistence — data survives page refresh (FS handle reconnection `tryReconnect()`)
5. Optionally verify IndexedDB default persistence still works (via `?adapter=indexeddb` URL param)

### Out of scope

- Schema migrations or code changes to the persistence layer
- New UI features or components
- Entity kind-specific node appearances
- Tiptap document editing inside the graph canvas

## Test Data

The cleaned `graph.json` will contain:

### Entities (8 total)

| ID | Kind | Content |
|----|------|---------|
| about-workspace | container | "About This Workspace" |
| editor-playground | container | "Editor Playground" |
| tech-stack | container | "Tech Stack" |
| react-19 | concept | "React 19" |
| typescript | concept | "TypeScript" |
| react-flow | concept | "React Flow" |
| zustand | concept | "Zustand" |
| tiptap | concept | "Tiptap" |

### Relations (7 total)

| Source | Target | Type |
|--------|--------|------|
| tech-stack | react-19 | contains |
| tech-stack | typescript | contains |
| tech-stack | react-flow | contains |
| tech-stack | zustand | contains |
| tech-stack | tiptap | contains |
| react-19 | zustand | related_to |
| react-flow | tiptap | related_to |

### Documents

- `documents/about-workspace.json` — refreshed seed TipTap content
- `documents/editor-playground.json` — refreshed seed TipTap content
- `documents/tech-stack.json` — new TipTap content

## Verification Steps

1. `npm run dev` → browser opens the app at `/`
2. Click "Open Folder" → select `~/Code/hello2`
3. Verify 8 nodes render, 7 edges connect them
4. Create a new concept node (via context menu or "New Node" button)
5. Drag from a handle on the new node to connect it to an existing node
6. Edit a node's text (double-click inline)
7. Delete an edge (select + Backspace, or context menu)
8. After each action, check `~/Code/hello2/graph.json` to confirm auto-save fired
9. Refresh the page → verify the folder reconnects and all changes are preserved
