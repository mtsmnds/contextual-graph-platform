# 2026-05-15: localStorage persistence replaces File System Access API

## Context
- The app was gated on `window.showDirectoryPicker` (File System Access API), which is only available in Chromium browsers. Users on Firefox, Safari, or any mobile browser saw "Your browser does not support the File System Access API" and could not use the app.
- When deployed as a static SPA (Cloudflare Pages, Vercel, Netlify), the File System Access API is unavailable because the file system is read-only — the app was effectively non-functional outside local dev.
- The folder picker mechanism had ongoing stability issues (permission races, "File picker already active" errors, Vite HMR reload loops) that consumed debugging time.
- The primary goal shifted to testing core features (Tiptap editing, page navigation, annotations) — the filesystem abstraction was blocking iteration velocity.

## Decision
Replace the File System Access API persistence layer with `localStorage`. The app is now a self-contained static SPA with bundled seed data.

**In scope:**
- localStorage auto-save (debounced 300ms) on every entity/relation change
- Bundled seed data (`src/data/seed.ts`) — two containers with Tiptap ProseMirror content, loaded on first visit
- Seed data written to localStorage on first load and persist across sessions
- Robust fallback if localStorage is unavailable (Safari private browsing) — app works but changes are ephemeral

**Out of scope:**
- No export/import buttons (can be added later as a convenience feature)
- No cross-device sync (acceptable for a personal workspace tool)
- No IndexedDB migration layer

## Alternatives Considered
- **File System Access API (status quo):** Cross-browser incompatibility, static deployment broken, ongoing debugging cost. Rejected.
- **IndexedDB for domain data:** Higher complexity, more code, no real benefit at current data scale (~KB of JSON). Rejected.
- **Only seed data, no persistence:** No state carries across refresh. Makes testing painful. Rejected.

## Consequences
- **Positive:** App works in every browser. Deployable as static SPA anywhere. Removed ~250 lines of filesystem code (`persistence.ts`, `config.ts`, ~200 lines from store, FolderPicker component). Zero debugging overhead for storage.
- **Trade-offs:** Data is tied to browser profile — clearing site data resets to seed. No cross-device portability (no `graph.json` on disk to share). Same-origin localStorage limit (~5-10MB) is more than sufficient for current use.
- **Risks:** None significant. localStorage is a mature, well-understood API. The seed data provides a reliable factory-reset baseline.

## Follow-ups
- Add "Export JSON" / "Import JSON" buttons for data portability (low priority).
- Verify build output deploys cleanly to Cloudflare Pages.
- Clean up `hello2/` and `hello3/` test data directories.
