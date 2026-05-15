# Changelog

## 2026-05-15

### Mention suggestion popup (PRD0018)
- **What:** Replaced the stub suggestion renderer in `TiptapEditor.tsx` with a proper React-based popup using shadcn's Command component
- **Reason:** The stub showed static "Loading..." text with no items, no keyboard nav, no click handling. Needed for cross-doc `@` mentions.
- **Files changed:**
  - `src/components/tiptap/MentionPopup.tsx`: **New** — React component wrapping shadcn Command with keyboard nav, mouse hover selection, empty state
  - `src/components/tiptap/mentionSuggestionRenderer.tsx`: **New** — factory bridging TipTap's suggestion plugin lifecycle to React via `createRoot`
  - `src/renderers/TiptapEditor.tsx`: Replaced inline `render: () => {...}` stub with `render: mentionSuggestionRenderer`
  - `src/components/ui/command.tsx`: Added via `npx shadcn@latest add command` (plus dialog, input-group, textarea subdeps)
- **Impact:** `@` now shows a styled popup with live filtering, keyboard navigation (up/down/enter/esc), click selection, and proper cursor positioning. No scaffolding left for Phase 3.3.
- **PRD:** `dev-docs/plans/prd0018-mention-suggestion-popup.md`

## Purpose
Significant completed changes with reasoning and references.
Use this to recover context after breaks.

## Entry Rules
- Completed, meaningful changes only (not tentative ideas).
- Short entries: what changed, why, impact.
- Significant design/process changes need a paired ADR in `archive/`.

---
## 2026-05-15

### localStorage persistence replaces File System Access API
- **What:** Replaced the File System Access API (`showDirectoryPicker` + `graph.json` read/write) with `localStorage`. Removed `FolderPicker` gate, `openFolder()`/`restoreFolder()` actions, `directoryHandle`/`folderName`/`saveStatus` store fields, `persistence.ts` (IndexedDB handle helpers), and `config.ts` (feature flags). Added `src/data/seed.ts` with two Tiptap containers ("About This Workspace" and "Editor Playground") that load on first visit. Auto-save writes to localStorage key `react-roadmap:graph` with the same 300ms debounce pattern. Cleaned up HomePage footer and AppSidebar (removed folder name and save status UI).
- **Reason:** The File System Access API only works in Chromium browsers, making the app non-functional in Firefox, Safari, and mobile — and completely broken when deployed as a static SPA. The folder picker had recurring stability issues that were consuming debugging time. The immediate priority is testing core features (Tiptap editing, navigation) without fighting storage infrastructure.
- **Files changed:**
  - `src/data/seed.ts`: Created — two containers with Tiptap ProseMirror content
  - `src/store/useGraphStore.ts`: Rewritten — removed FS API, added localStorage init + auto-save, seed fallback
  - `src/App.tsx`: Removed FolderPicker, removed restoreFolder/directoryHandle branching, simplified
  - `src/components/HomePage.tsx`: Removed folderName/saveStatus/footer save-dot
  - `src/components/AppSidebar.tsx`: Removed folderName footer display
  - `src/persistence.ts`: Deleted (no longer needed)
  - `src/config.ts`: Deleted (no longer needed)
  - `vite.config.js`: Removed `hello2/graph.json` watch ignore
  - `AGENTS.md`: Updated Key Paths and seed data description
  - `dev-docs/architecture.md`: Updated Store/Output/Feature-Flag sections, module map
  - `dev-docs/changelog.md`: Added this entry
  - `dev-docs/roadmap.md`: Added to Recently Completed

---

## 2026-05-15

### Content separation — graph vs document store (PRD0018)

- **What:** Separated graph metadata from document content. Removed `content` from the container entity path — container bodies now live in separate localStorage keys (`react-roadmap:content:{id}`). Added `getContent(id)`, `saveContent(id, data)`, `clearContent(id)` to the store. Container IDs use timestamp-based `generateDocId()` (`doc_{timestamp}`) instead of slugified titles, so multiple "Untitled" pages have unique stable IDs. ReadingViewport loads container content from the content store on focus. Segment entities retain their `content` field for hamlet legacy.
- **Reason:** Storing stringified TipTap JSON in `Entity.content` bloated `graph.json`, made the graph unqueryable without parsing every document body, and violated separation of concerns. The graph should answer "what documents exist and how are they connected" — document bodies are a separate concern.
- **Files changed:**
  - `src/engine/ids.ts`: Added `generateDocId()` for timestamp-based container IDs. Root-level containers now use `doc_{timestamp}` instead of `slugify("Untitled")`.
  - `src/store/useGraphStore.ts`: Added `contentLoaded`, `getContent`, `saveContent`, `clearContent`. Container content is no longer stored on the entity. `updateEntity` strips `content` for containers.
  - `src/renderers/ReadingViewport.tsx`: Empty containers load content from `getContent()` instead of `entity.content`. Save goes through `saveContent()`.
  - `dev-docs/archive/2026-05-15-content-separation.md`: Created ADR.
  - `dev-docs/plans/prd0018-content-separation.md`: Created and promoted to archive.
  - `dev-docs/architecture.md`: Updated domain model, store, and persistence documentation.
  - `dev-docs/roadmap.md`: Added to Recently Completed.
- **ADR:** `archive/2026-05-15-content-separation.md`
- **Archive:** `archive/2026-05-15-prd0018-content-separation.md`

### Sidebar home navigation — PRD0015
- **What:** Stripped React Flow from the app entirely. Replaced the floating popover sidebar with a permanent shadcn `Sidebar` containing Home link, page list, and "New page" button. Created a `HomePage` view showing root containers as clickable cards with save status. Page creation is now one-click from sidebar or home page. Removed `CanvasView`, `assignLayout`, `toReactFlowNodes`, `toReactFlowEdges`. Layout changed from conditional canvas/viewport to `SidebarProvider + AppSidebar + SidebarInset + HomePage/ReadingViewport`.
- **Reason:** The dual-mode app (canvas vs. reading viewport) was fragile — changes to one path destabilized the other. React Flow was a distraction while the core reading + editing experience still needs validation. The popover sidebar was a two-click detour for the most common action (page navigation).
- **Files changed:**
  - `src/App.tsx`: Removed React Flow imports/CSS, `CanvasView`, `assignLayout`, `toReactFlowNodes`, `toReactFlowEdges`, `SidebarPopover`, `?view=graph` URL branch. New layout: `SidebarProvider → AppSidebar + SidebarInset → HomePage or ReadingViewport`.
  - `src/components/AppSidebar.tsx`: Created — permanent shadcn sidebar with Home link, root container list, "New page" button, folder name footer.
  - `src/components/HomePage.tsx`: Created — root container cards, new page CTA, save status bar.
  - `dev-docs/roadmap.md`: Moved canvas items to Later, added PRD0015 to Recently Completed, reordered Now/Next/Later.
  - `dev-docs/architecture.md`: Updated module map (removed canvas adapters, added AppSidebar/HomePage).
- **Impact:** App is now the reading workspace. No canvas mode-switching. Sidebar is always visible. Page creation and selection are single-click. React Flow dependency remains in package.json but is no longer imported/bundled — ready for Phase 5 reintroduction.
- **Archive:** `archive/2026-05-15-prd0015-sidebar-home-navigation.md`

---

## 2026-05-15

### TipTap UI Phase 1: Simple Editor scaffold — PRD0014
- **What:** Scaffolded TipTap's Simple Editor template (MIT) for the Playground editing experience. Created `TiptapEditor` wrapper with full toolbar (formatting, headings, lists, alignment, blockquote, code, link, image upload, undo/redo). Implemented debounced save strategy (onBlur + 1.5s idle + onUnmount) to prevent ProseMirror/Zustand transaction collisions that caused blank-screen crashes on complex operations. Empty containers now render full-width editor with no duplicate content and no empty sidebar.
- **Reason:** The bare contenteditable editing experience had no toolbar or formatting controls. The `onUpdate`-driven Zustand sync caused crashes on complex ProseMirror operations (blockquote toggle) due to synchronous state updates during transaction cycles.
- **Files changed:**
  - `src/renderers/TiptapEditor.tsx`: Created — full editor wrapper with toolbar, debounced save
  - `src/renderers/ReadingViewport.tsx`: Empty containers get full-width editor (no sidebar, no duplicate SegmentCard)
  - `package.json`: Added `sass`
  - `src/index.css`: Added TipTap UI SCSS imports
  - 144 TipTap UI component files scaffolded by CLI
- **Impact:** Full editing experience on Playground with toolbar. Blockquote and other complex operations no longer crash. Content auto-saves on blur, after 1.5s idle, and on unmount. Hamlet layout unchanged. Phase 1 complete — ready for BubbleMenu, Drag Handle, and additional extensions.
- **ADR:** Included in archive file.
- **Archive:** `archive/2026-05-15-prd0014-tiptap-ui-p1.md`

---

## 2026-05-15

### TipTap UI Phase 2: Free Notion-like delta — PRD0016
- **What:** Added BubbleMenu (floating toolbar on text selection), Drag Handle (block drag-and-drop), Placeholder extension, and Emoji autocomplete to the editor. All features are free/MIT, no paid subscription.
- **Reason:** Phase 1 delivered the toolbar; Phase 2 adds the hallmark block editor interactions (floating menu, drag reorder) that make the editor feel modern.
- **Files changed:**
  - `package.json`: Added `@tiptap/extension-placeholder`, `@tiptap/extension-emoji`, `@tiptap/extension-drag-handle-react`, `@tiptap/extension-drag-handle`, `@tiptap/extension-node-range`
  - `src/renderers/TiptapEditor.tsx`: Added BubbleMenu, DragHandle, Placeholder, Emoji
- **Impact:** Full block-editing experience on Playground. Drag handle needs polish (alignment/sizing). Emoji is basic (`:code:` only). Slash commands deferred — pending research on open-source alternatives.
- **Archive:** `archive/2026-05-15-prd0016-tiptap-ui-p2.md`

---

## 2026-05-15

### TipTap + page navigation — PRD0013
- **What:** Integrated TipTap into the reading viewport as the content renderer, replacing `dangerouslySetInnerHTML`. Created `RichTextContent` component supporting both read-only and editable modes. Added three root containers (`playground`, `books`, `roadmap`) to `hello2/graph.json`. Added `view` param to URL sync (`?view=page|graph`). Fixed URL restore race condition where React 19 strict mode double-effects caused the second `restoreFolder()` call to overwrite the focused entity. Relaxed container content model — containers can now hold content directly (Playground is an editable page). Created TipTap–graph mapping test plan for ProseMirror JSON vs HTML exploration.
- **Reason:** The reading viewport rendered content via raw `dangerouslySetInnerHTML` with no rich text model. TipTap was the chosen editor and needed integration before annotation creation and inline editing. URL navigation needed `view` param for mode switching. The container content guard blocked the Playground editing test.
- **Files changed:**
  - `src/renderers/RichTextContent.tsx`: Created — TipTap-based content renderer (read-only + editable, onUpdate support)
  - `src/renderers/ReadingViewport.tsx`: Replaced `ContentHtml` with `RichTextContent`. Added editable content area for empty containers. Removed `dangerouslySetInnerHTML`.
  - `src/store/useGraphStore.ts`: Removed `if (kind === "container") delete final.content` guard. Added `requestPermission` in `openFolder()`. Removed `view` reset in `restoreFolder()` (fixes URL restore race).
  - `src/App.tsx`: Added `view` param to URL sync and restore logic.
  - `hello2/graph.json`: Added `playground`, `books`, `roadmap` root containers. Added `books → hamlet` contains relation.
  - `dev-docs/roadmap.md`: Updated Now section with TipTap plan.
  - `dev-docs/archive/2026-05-14-tiptap-page-navigation.md`: Created — PRD0013 plan.
  - `dev-docs/plans/prd0013-tiptap-graph-mapping.md`: Created — test plan for ProseMirror JSON vs HTML and per-entity vs per-container document models.
- **Impact:** Content renders through TipTap with proper ProseMirror model. `dangerouslySetInnerHTML` eliminated. Empty containers (Playground, Roadmap) are editable pages. URL navigation includes view mode. Three root containers provide navigation entry points. URL restore works reliably. Foundation for editable TipTap, annotation creation, and ProseMirror JSON exploration.
- **ADR:** `dev-docs/plans/prd0013-tiptap-graph-mapping.md` (deferred — test plan)
- **Archive:** `archive/2026-05-14-tiptap-page-navigation.md`

---

## 2026-05-14

### Popover sidebar navigation — M2 Phase 1 (PRD0012)
- **What:** Replaced the AppHeader with a floating three-dots button (MoreHorizontal) that opens a popover containing a shadcn Sidebar with root-level entity navigation. The sidebar lists root containers (works, roadmaps, note collections) as flat menu items. The ReadingViewport header (X + breadcrumb) was removed — titles display inline as card content. Added `getRootContainers` to the query engine.
- **Reason:** The header was a relic of the canvas-centric design. Removing it gives a cleaner, card-based reading experience. The popover sidebar provides immediate graph navigation without a persistent sidebar that changes the main layout.
- **Files changed:**
  - `src/App.tsx`: Removed AppHeader component. Added SidebarPopover inline component using shadcn Popover + Sidebar primitives. Layout is now content-only with a floating dots button.
  - `src/renderers/ReadingViewport.tsx`: Removed `<header>` with X button and breadcrumb. Removed unused `getContainerBreadcrumb` and `resolveContainer` imports.
  - `src/engine/queries.ts`: Added `getRootContainers` — returns entities with kind "container" and no incoming "contains" relation.
  - `src/components/ui/popover.tsx`: Installed (shadcn Base UI popover)
  - `src/components/ui/sidebar.tsx` + 6 supporting files: Installed (shadcn Base UI sidebar)
- **Impact:** No header bar — content fills the full viewport. Three-dots button floats in the top-right corner. Opening it shows root containers for navigation. ReadingViewport content scrolls edge-to-edge with card-based rendering. Canvas View access moved into the sidebar popover. Foundation for home page (root container listing) and mode switcher.
- **Archive:** `archive/2026-05-14-sidebar-navigation.md`

### Fix: SidebarProvider wrapping + layout conflict
- **What:** Two bugs in the initial sidebar implementation: (1) `useSidebar()` threw because no `SidebarProvider` ancestor existed; (2) `SidebarProvider`'s flex layout (`flex min-h-svh w-full`) broke React Flow's parent container sizing. Fixed by importing `SidebarProvider` and wrapping the App return with `className="contents"` to provide context without layout interference.
- **Reason:** The initial implementation followed the plan's pattern code which omitted `SidebarProvider` — the plan only showed `Popover → Sidebar` without the required provider context. The second bug was a conflict between shadcn's sidebar layout and React Flow's sizing contract.
- **Files changed:**
  - `src/App.tsx`: Imported `SidebarProvider`, wrapped `App` return, added `className="contents"` to prevent flex layout from breaking React Flow's parent container
- **Impact:** Sidebar opens without errors. React Flow canvas renders at full viewport height. The fix pattern (`SidebarProvider className="contents"`) should be used for any future sidebar-in-popover or sidebar-in-overlay patterns.
- **ADR:** `archive/2026-05-14-sidebar-navigation.md`

---

## 2026-05-13

### Persistence layer — PRD0003
- **What:** Added localStorage auto-save with debounce, startup hydration, and manual export/import of entities and relations. Domain state survives page refresh for the first time.
- **Reason:** The graph store was entirely in-memory — any work was lost on refresh. Persistence is a prerequisite for the reading workspace (M2) where users need to keep annotations and notes across sessions.
- **Files changed:**
  - `src/types/graph.ts`: Added `GraphSnapshot` type
  - `src/store/useGraphStore.ts`: Added `loadInitialState()` hydration, debounced auto-save subscription, `exportGraph` (JSON download), `importGraph` (replace state)
- **Impact:** State persists automatically. Manual export/import enables backups and sharing. Foundation for future SQLite storage (PRD0003 out of scope: no schema migrations, no settings UI).
- **Archive:** `archive/2026-05-13-prd0003-persistence-layer.md`

---

## 2026-05-13

### Continuous scroll viewport — PRD0005
- **What:** Replaced the single-segment reading viewport with a container-aware scrollable view. Containers now render all child segments stacked vertically — acts as large headings, scenes as medium headings, character speeches with labels, stage directions in italic. Breadcrumb navigation shows the container path. Canvas clicks resolve to the parent container so users enter the reading viewport at the work level, not the segment level. Added `getContainerChildren`, `resolveContainer`, and `getContainerBreadcrumb` to the query engine.
- **Reason:** The segment-by-segment prev/next model destroyed reading flow for long-form text. The UX vision requires continuous vertical scrolling as the primary reading axis, with segments as the content *of* a work, not separate pages.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Rewrote — SegmentCard variants for act/scene/character/stage-direction/annotation, breadcrumb header, prev/next within container children
  - `src/engine/queries.ts`: Added `getContainerChildren` (ordered child chain resolution), `resolveContainer` (walk up contains to find parent), `getContainerBreadcrumb` (path traversal)
  - `src/App.tsx`: Updated — canvas click resolves to parent container via `resolveContainer`
  - `src/store/useGraphStore.ts`: Updated seed data — added `contains` relations for all hamlet segments under act_1, added `type: "act"` metadata
  - `dev-docs/roadmap.md`: Updated milestones and sprint order
  - `dev-docs/plans/prd0005-hamlet-import.md` → `prd0006-hamlet-import.md`: Renumbered
- **Impact:** Reading viewport now works like a book — scroll through the full text. Container resolution means clicking any node on the canvas opens its work context. Foundation laid for side-panel expansion and multi-column reading.
- **Archive:** `archive/2026-05-13-prd0005-continuous-scroll-viewport.md`

---

## 2026-05-13

### Full text import — PRD0006
- **What:** Built a Gutenberg HTML parser for Hamlet (`scripts/import-gutenberg.ts`) that produces 1342 entities and 2634 relations across 5 acts, 20 scenes, 40 characters. The snapshot is bundled into the app and loads on first run (empty localStorage). Added `npm run import:hamlet` command.
- **Reason:** The continuous scroll viewport needed real content at scale. The full play validates reading navigation, localStorage persistence, and canvas rendering with ~1,300 entities.
- **Files changed:**
  - `scripts/import-gutenberg.ts`: Created — DOM-based Gutenberg HTML parser with character extraction, scene/act detection, continuation merging
  - `src/data/hamlet.json`: Generated — bundled Hamlet snapshot (1342 entities, 2634 relations)
  - `src/store/useGraphStore.ts`: Updated — first run loads full Hamlet from bundled snapshot
  - `package.json`: Added `import:hamlet` script
- **Impact:** Demo-ready — clicking "Act I" on the canvas shows the full play as a scrollable text. Next step: side-panel contextual expansion for annotations and references.
- **Archive:** `archive/2026-05-13-prd0006-hamlet-import.md`

---

## 2026-05-14

### Minimal Entity Model — PRD0010-1
- **What:** Implemented the core entity model rules and ID scheme. Created `src/engine/ids.ts` with `slugify`, `generateEntityId`, and collision handling. Wired into store: `addEntity` auto-generates semantic IDs (e.g. `parent_seg-0001`), enforces no-title-on-segments and no-content-on-containers. `updateEntity` propagrates ID changes through all relations. Added HTML content rendering in the reading viewport.
- **Reason:** The entity model rules were validated against the 1,359-entity Hamlet restructuring. The ID scheme makes graph.json self-documenting — an ID like `hamlet_act-01_scene-01_seg-0001` tells you the entity's place in the graph. The model rules prevent data inconsistencies at creation time.
- **Files changed:**
  - `src/engine/ids.ts`: Created — slugify, generateEntityId, generateUniqueId
  - `src/store/useGraphStore.ts`: Updated addEntity (ID generation, model enforcement), updateEntity (rename propagation), deleteEntity (cascade)
  - `src/renderers/ReadingViewport.tsx`: Added ContentHtml component for HTML content rendering
- **Impact:** New entities automatically get semantic IDs. Segments and containers are structurally consistent. HTML content renders correctly (title page `<h1>`, etc.). M1 milestone complete.
- **Archive:** `archive/2026-05-14-prd0010-1-minimal-entity-model.md`

---

## 2026-05-14

### Fix: skip auto-save on initial disk load, flip PERSIST_HANDLE default to true
- **What:** Two fixes: (1) the auto-save subscription now checks `_hydrated` flag and skips writes during initial store population from disk — prevents Vite HMR loop when `graph.json` is inside the project root; (2) `PERSIST_HANDLE` default flipped to `true` (opt-out via `VITE_PERSIST_HANDLE=false`).
- **Reason:** Opening a folder inside the Vite project root caused the initial auto-save write-back to trigger a full page reload, creating an infinite loop. Handle persistence was opt-in but the user expects it to just work.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Added `_hydrated` module-level flag, set to `true` after `openFolder()` and `restoreFolder()` population, checked in auto-save subscription
  - `src/config.ts`: Changed `=== "true"` to `!== "false"` — default is now `true`
  - `dev-docs/architecture.md`: Updated feature flag description
  - `dev-docs/roadmap.md`: Updated Recently Completed
- **Impact:** No more reload loop. Handle persistence works out of the box.

---

### Handle Persistence & URL-Based Navigation — PRD0011
- **What:** Two coordinated changes: (1) feature-flagged folder handle persistence via IndexedDB so users don't re-pick their folder every session, (2) URL-based view state sync so page reloads restore the reading viewport position. When `VITE_PERSIST_HANDLE=true`, the `FileSystemDirectoryHandle` is stored in IndexedDB and silently restored on startup — the folder picker is skipped entirely. The view state (`focusedEntityId`, `anchorEntityId`) is synced to URL search params via `history.replaceState` (debounced 200ms), and restored after folder resolution on load. Stale entity IDs in URLs gracefully fall back to the canvas view.
- **Reason:** Editing `graph.json` externally caused page reloads that lost the user's place. Re-picking the folder every session was friction that broke flow. The URL is a natural bookmarkable anchor for the reading viewport.
- **Files changed:**
  - `src/config.ts`: Created — feature flag `PERSIST_HANDLE` from `VITE_PERSIST_HANDLE` env var
  - `src/persistence.ts`: Created — IndexedDB helpers (`saveHandle`, `loadHandle`, `clearHandle`)
  - `src/store/useGraphStore.ts`: Added `restoreFolder()` action, persist handle after `openFolder()` when flag is on, global type augmentation for `FileSystemHandle.requestPermission`
  - `src/App.tsx`: Added three effects — handle restore on mount, URL param restoration after folder resolve, URL sync on view state change
  - `dev-docs/requirements.md`: Updated persistence requirements
  - `dev-docs/architecture.md`: Added store actions, feature flag section, module map entries
  - `dev-docs/roadmap.md`: Updated Recently Completed
- **Impact:** Users with `VITE_PERSIST_HANDLE=true` see zero friction on reload — folder reconnects, view restores. Users with the flag off see no change. URL is now a bookmarkable entry point to any entity. No new dependencies.
- **ADR:** `archive/2026-05-14-handle-persistence-and-url-navigation.md`
- **Archive:** `archive/2026-05-14-prd0011-handle-persistence-and-url-navigation.md`

---

### File System Persistence — PRD0009
- **What:** Replaced localStorage with the File System Access API. The user picks a folder at startup — the app reads/writes `graph.json` inside it. No seed data, no localStorage, no hidden state. App shows a folder picker gate on launch, renders folder name + save status in a header bar. Removed `hamlet.json` bundle import (cut JS bundle from 968 KB to 425 KB).
- **Reason:** localStorage is opaque to users and agents, has no permanence across machines, and contradicts the product goal of making data transparent and portable. The user's graph should be a file they can see, edit, version, and share.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Rewritten — removed `seedEntities`, `seedRelations`, `hamletData` import, `loadInitialState()`, `persistToDisk()`, `exportGraph()`, `importGraph()`, localStorage auto-save. Added `directoryHandle`, `folderName`, `saveStatus`, `openFolder()` action, FS API auto-save subscription.
  - `src/App.tsx`: Added `FolderPicker` gate (unsupported browser message + open folder button), `AppHeader` (folder name + save status dot), canvas height fix (`100vh` → `100%`).
- **Impact:** App no longer works without a user-picked folder. Data is a plain JSON file the user owns. 425 KB JS bundle (was 968 KB with bundled hamlet.json). Clear localStorage before using.
- **Archive:** `archive/2026-05-14-prd0009-file-system-persistence.md`

---

## 2026-05-14

### Pure Domain Loader — PRD0008
- **What:** Stripped all runtime merging, source detection, and content matching from `loadInitialState()`. It is now a straight three-step cascade: try localStorage → try hamlet.json → fall back to seed data → return as-is. No post-processing. Each data source is self-contained (all relation targets exist within the same source).
- **Reason:** The loader was making assumptions about the data (checking for `seg_18`/`seg_1614` to guess the source, merging annotation entities from one source into another). This was the same class of bug that caused the content-matching failure — the domain model should be unquestionable. What's in the file is what you get.
- **Files changed:**
  - `src/store/useGraphStore.ts`: Removed annotation entity merging loop, source detection check, and annotation relation merging block (lines 129–159). `loadInitialState()` now returns the selected source directly.
- **Impact:** Zero runtime assumptions about data integrity. If a source has dangling relation targets, queries return empty results (harmless). The store is simpler and easier to reason about.
- **Archive:** `archive/2026-05-14-prd0008-pure-domain-loader.md`

---

## 2026-05-14

### Fix annotation seed data — embed directly in hamlet.json
- **What:** Replaced the fragile content-matching approach (which tried to match segments by text normalization at runtime) with direct embedding of 5 annotation entities (`note_1`–`note_4`, `ref_1`) and 5 relations (`r_6`–`r_10`) in `src/data/hamlet.json`. The relations now target actual hamlet segment IDs (`seg_18` for "Who's there?", `seg_1614` for "To be, or not to be"). The store's `loadInitialState()` was cleaned up — removed the broken content-matching code, and the annotation merging now correctly sources relations from hamlet.json when hamlet data is detected (presence of `seg_18`/`seg_1614`), falling back to seed relations for the seed data path.
- **Reason:** The content-matching approach was broken — the `norm()` regex only handled straight apostrophes but the hamlet JSON uses curly quotes (U+2019), so "Who's there?" never matched its segment. Only the "To be" segment worked because its search term has no apostrophes. Additionally, the approach was fragile (depended on text normalization) and added relations with wrong source IDs (`hamlet_1`/`hamlet_2` don't exist in hamlet JSON) when loaded from localStorage.
- **Files changed:**
  - `src/data/hamlet.json`: Added 5 annotation entities and 5 annotates/references relations directly into the JSON
  - `src/store/useGraphStore.ts`: Removed content-matching block; annotation merging now detects hamlet data and sources relations from the embedded hamlet.json data; falls back to seed relations for non-hamlet data
- **Impact:** Annotation indicators now appear on both "Who's there?" (seg_18) and "To be, or not to be" (seg_1614) in the reading viewport. Users with existing localStorage should clear it (DevTools > Application > Local Storage) to pick up the fresh hamlet.json annotations. The approach is now data-driven rather than algorithm-driven, which is more reliable.

---

## 2026-05-13

### Contextual expansion — PRD0007
- **What:** Added relation indicators (`ChatCircleText` for annotations, `Link` for references) in the right gutter of segments with outgoing relations. Clicking an indicator reveals an annotation card below the segment with the linked content. Cards use a bordered card style with relation type label, entity title, content, and × close button. Seed data enriched with 2 new annotations and 1 reference. `focusEntity` resets expanded panels on navigation.
- **Reason:** The horizontal axis of the vision (contextual expansion) was completely missing — readers could see no relations and had no way to view linked content. This is the first step toward the Notion-style/Talmudic inline annotation model.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Added AnnotationCard component, indicator icon in right gutter of SegmentCard, toggle via expandedPanels
  - `src/store/useGraphStore.ts`: Enriched seed data (note_3, note_4, ref_1 + relations); focusEntity resets expandedPanels
- **Impact:** Reading viewport now shows relation indicators. Clicking reveals annotations inline. Foundation for "Talmud mode" (show all) and annotation creation.

---

## 2026-05-13

### Work entity + full-play scrolling
- **What:** Added `hamlet--william-shakespeare` work entity that contains the entire play — Dramatis Personæ, all 5 acts, Transcriber's Notes — as one scrollable view. `resolveContainer` walks to the root work, so clicking any node shows the full play with that section in context. Canvas shows the work node alongside its children.
- **Files changed:**
  - `scripts/import-gutenberg.ts`: Added work entity creation, Dramatis Personæ parsing, Transcriber's Notes capture, full content boundary iteration
  - `src/data/hamlet.json`: Regenerated (1346 entities, 2664 relations, 8 work children)
  - `src/renderers/ReadingViewport.tsx`: Added SegmentCard variant for `type: "work"` (title heading)
- **Impact:** Scroll the entire play top-to-bottom from the title page through all acts to the notes. Clear localStorage (DevTools > Application) to reload fresh data.

---

## 2026-05-13

### Reading viewport + shadcn/ui — PRD0004
- **What:** Built the first real renderer — a focused reading viewport that displays entity content with prev/next navigation. Added Tailwind v4 and shadcn/ui (Base UI) as the component foundation. Canvas now supports click-to-focus mode switching.
- **Reason:** The canvas adapter bridge was temporary — the product validates on a clean reading experience. shadcn/ui provides high-quality accessible components without obscuring custom styles, laying a scalable design foundation.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Created — focused entity display with prev/next/back navigation
  - `src/App.tsx`: Updated — mode-switch rendering (canvas vs viewport), onNodeClick wiring
  - `src/index.css`: Replaced Vite template styles with full shadcn/Tailwind theme, cleaned up conflicts
  - `index.html`: Added dark mode class toggle script
  - `vite.config.js`: Added tailwindcss plugin, @/ path alias
  - `tsconfig.json`: Added @/ path alias
  - `package.json`: Added tailwindcss, @tailwindcss/vite
  - `src/components/ui/button.tsx`: Created by shadcn init
  - `src/lib/utils.ts`: Created by shadcn init (cn utility)
  - `dev-docs/visual-design.md`: Created — design principles and conventions
- **Impact:** First real renderer replaces the temporary canvas bridge. Component foundation clean and scalable.
- **Archive:** `archive/2026-05-13-prd0004-reading-viewport.md`

---

## 2026-05-13

### Domain engine refactor — PRD0002
- **What:** Replaced the React-Flow-coupled AppNode/AppEdge types with a pure Entity/Relation domain model. Rewrote the store to hold separate domain state and view state. Created the query engine. Added a canvas adapter bridge to keep React Flow rendering alive during the transition.
- **Reason:** The old architecture treated React Flow nodes as domain entities, mixing viewport state (coordinates, dragging, selection) with the semantic model. The new model decouples state from rendering, enabling the reading workspace (M2) without fighting canvas internals.
- **Files changed:**
  - `src/types/graph.ts`: Rewrote — Entity/Relation/ViewState types, removed AppNode/AppEdge/NodeKind/EdgeKind/EdgeBehavior
  - `src/store/useGraphStore.ts`: Rewrote — entities/relations/view slices, no React Flow imports
  - `src/engine/queries.ts`: Created — getEntity, getRelations, getSequentialContext, getLinkedContext
  - `src/App.tsx`: Updated — canvas adapter bridge transforms domain entities to React Flow nodes
  - `src/App.css`: Deleted (unused Vite template residuals)
  - `dev-docs/requirements.md`: Updated — reflects new type ontology
  - `dev-docs/architecture.md`: Already updated in prior commit
- **Impact:** Domain model is now framework-agnostic. Store is simpler and testable. React Flow canvas still renders the same seed data. Foundation for reading workspace laid.
- **ADR:** `archive/2026-05-13-prd0002-domain-engine-refactor.md`

---

## 2026-05-13

### Architectural pivot: decouple domain model from React Flow
- **What:** Adopted the architecture review recommendation to restructure the system as Entity Graph → Projection Layer → Renderer. React Flow demoted from core runtime to optional spatial renderer (Phase 4+). Roadmap reordered to validate contextual reading before graph visualization.
- **Reason:** The original plan coupled domain state to canvas coordinates and React Flow internals, which would make reading workspace UX brittle. Decoupling lets us validate the core interaction (contextual reading) without fighting canvas complexity.
- **Files changed:**
  - `dev-docs/roadmap.md`: Full rewrite with 4 new milestones
- **Impact:** The immediate work shifts from building custom graph nodes to refactoring the domain schema and building a reading workspace. React Flow work deferred to Phase 4.

---

## 2026-05-15

### Fix: content loading race + cleanup effect saving to wrong entity
- **What:** Two bugs: (1) Content loaded via `useEffect` + `useState` caused a flash of empty editor on every page open, then `setDocContent` would trigger a re-render where TipTap's `setContent()` sometimes applied and sometimes didn't. (2) The cleanup `useEffect` used `onSaveRef.current` which is updated on every render — when navigating from entity A to entity B, the cleanup ran AFTER React had updated `onSaveRef.current` to entity B's callback, causing entity A's content to be saved under entity B's ID in the content store.
- **Fix:**
  - ReadingViewport: switched from `useEffect` + `useState` to `useMemo` for content loading — content is synchronous during render, no flash, no race.
  - TiptapEditor: added `mountOnSaveRef`/`mountOnTitleChangeRef` — captured at mount time and never updated. The cleanup effect uses these mount-time refs instead of the live refs, so it always saves to the correct entity regardless of re-render order.
- **Impact:** No more empty editors on page load. No more content corruption when navigating between pages (which was causing duplicate "Editor Playground" entries in the sidebar). Fresh `localStorage.clear()` recommended for users with corrupted content store.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: `useEffect`/`useState` → `useMemo` for content. Removed `useState`/`useEffect` imports.
  - `src/renderers/TiptapEditor.tsx`: Added `mountOnSaveRef`/`mountOnTitleChangeRef` for clean cleanup. Cleanup now uses mount-time refs.
  - `src/store/useGraphStore.ts`: Removed `set()` call from `getContent` (was causing unnecessary re-renders during a read function).

---

## 2026-05-13

### Typed graph schema and Zustand store
- **What:** Created the typed data layer and global state management for the graph system, replacing the stock Vite template.
- **Reason:** Establish the foundation before building any UI — NodeKind/EdgeKind types, store actions, and a React Flow canvas.
- **Files changed:**
  - `src/types/graph.ts`: Node/Edge TypeScript types with React Flow integration
  - `src/store/useGraphStore.ts`: Zustand store with mutation actions and seed data
  - `src/App.tsx`: React Flow canvas (replaced stock Vite demo template)
  - `src/main.tsx`: Entrypoint (migrated to TypeScript)
  - `tsconfig.json`: Strict TypeScript config
  - `package.json`: Added typescript, zustand
  - `index.html`: Script ref → main.tsx
- **Impact:** Foundation for all future graph features. No visual custom nodes yet.
- **ADR:** N/A — scaffolding, not a design decision requiring an ADR.
