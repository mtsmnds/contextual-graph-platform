# Data Tier Organization

## Overview

Data for the hello-to-react-roadmap migration is split across three
tiers with different audiences, commit rules, and lifecycles.

## Tiers

### 1. Seed — `src/data/seed.ts`

Shipped in the npm package.  Minimal demo content loaded when a user
opens the app for the first time (no existing workspace).

**Audience:** new users, development, Storybook.
**Commited:** yes.
**Schema:** TypeScript objects matching `Entity[]` + `Relation[]`.

Content is a small hand-picked subset — enough to show the system
working.  For the reading use case this could be 5–10 books and
authors, but currently holds the roadmap demo (2 containers).

```
src/data/seed.ts
```

### 2. Public site data — `public-data/graph.json`

Curated data that powers the static site (no backend — the json is
served directly).  Contains the full book/author collection,
geography chains, tags, and public reading history.

**Audience:** site visitors.
**Commited:** yes.
**Schema:** v5 `GraphSnapshot` (entities + relations).

Content originates from the user's private workspace and is
published by snapshotting stable data into this file.

```
public-data/graph.json       ← everything public
```

### 3. Private workspace — FS Access folder (e.g., `hello2/`)

The user's live workspace read and written by react-roadmap via the
File System Access adapter.  Contains all entities/relations,
including reading history and any personal notes.

**Audience:** the user only.
**Commited:** no (outside the repo).
**Schema:** same v5 `GraphSnapshot`.

```
hello2/
├── graph.json               ← full workspace snapshot
└── documents/               ← container TipTap content
```

## Workflow

```
edit in private workspace
       │
       ▼
   stable? ──▶ snapshot into public-data/graph.json
                    │
                    ▼
              commit + deploy (static site)
```

There is no backend.  Publishing means copying the relevant
entities and relations from the private workspace into
`public-data/graph.json`, stripping nothing (reading history is
public).  A future `npm run publish` script could automate this
by reading the Zstand store or the FS Access folder.

## What lives where (example)

| Content | Seed | Public | Private |
|---|---|---|---|
| Shakespeare (author) | yes | yes | yes |
| Hamlet (book) | yes | yes | yes |
| All 277 books | no | yes | yes |
| Geography chain (UK → Avon) | yes | yes | yes |
| Reading history | no | yes | yes |

Seed is a fraction of public-data; public-data is the full curated
snapshot; the private workspace is the working copy.
