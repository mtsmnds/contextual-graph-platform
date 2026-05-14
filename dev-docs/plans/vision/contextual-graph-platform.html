<!-- report-kit -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="style.css">
<title>Unified Project Documentation</title>

<div class="report"><div class="report-wrap">

  <header class="report-header">
    <div class="report-header-left">
      <span class="report-from">Project Documentation</span>
    </div>
    <span class="report-date" id="reportDate"></span>
  </header>

  <h1 class="report-headline">Contextual Graph<br>Platform</h1>

  <div class="report-intro">
    <p><strong>A unified node-and-edge system that powers two products from one core: a visual project roadmap and a relational reading workspace.</strong> This document consolidates the ChatGPT product spec with the Google AI engineering scaffold into six standalone files for your <code>docs/</code> directory. Each file is scoped to one concern so AI tools get exactly the context they need per task.</p>
  </div>

  <div class="metrics-strip">
    <div class="metrics-strip-border"></div>
    <div class="metric" style="grid-column: span 3">
      <div class="metric-value">6</div>
      <div class="metric-label">Documents</div>
    </div>
    <div class="metric" style="grid-column: span 3">
      <div class="metric-value">5</div>
      <div class="metric-label">Phases</div>
    </div>
    <div class="metric" style="grid-column: span 3">
      <div class="metric-value">1</div>
      <div class="metric-label">Core Schema</div>
    </div>
    <div class="metric" style="grid-column: span 3">
      <div class="metric-value">2</div>
      <div class="metric-label">Products</div>
    </div>
  </div>

  <hr class="report-rule">

  <main class="report-body">

    <!-- FILE STRUCTURE -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">I. The docs/ Directory</h2></div>
      <div class="section-items">
        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">File map</h3>
            <p>Each file has a version header and links to related docs. The README acts as the hub.</p>
          </div>
          <div class="item-body">
<pre style="font-size:0.82em; line-height:1.5;">docs/
├── README.md              # Hub — links all docs, explains the system
├── VISION.md              # Why — north star, audience, value prop
├── UX_PRINCIPLES.md       # How it feels — interaction design tenets
├── PRD.md                 # What — functional requirements by phase
├── ARCHITECTURE.md        # How it's built — stack, data models, schema
└── ROADMAP.md             # When — phases, tasks, dependencies</pre>
          </div>
        </article>
      </div>
    </section>

    <!-- VISION -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">II. VISION.md</h2></div>
      <div class="section-items">
        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">The North Star</h3>
            <span class="item-badge">Rarely changes</span>
            <p>Feed this to AI when brainstorming features or evaluating scope.</p>
          </div>
          <div class="item-body">
            <p><strong>Core thesis:</strong> Text, tasks, ideas, and knowledge are not flat documents — they are graphs. Every piece of content is a node. Every relationship (dependency, reference, translation, commentary) is a typed edge. The UI behavior changes based on the edge type, not the content type.</p>
            <p><strong>Two products, one core:</strong></p>
            <ul class="item-bullets">
              <li><strong>Product A — Roadmap Canvas:</strong> A visual project planning tool where nodes are tasks/phases and edges are dependencies. The user creates, connects, and tracks work items on an infinite canvas. Obsidian Canvas is the closest reference.</li>
              <li><strong>Product B — Contextual Reader:</strong> A relational reading platform where nodes are text segments, annotations, and works. Edges are semantic relationships (references, translations, thematic echoes). Clicking an edge expands context laterally instead of navigating away.</li>
            </ul>
            <p><strong>Target user:</strong> Solo builders, researchers, and knowledge workers who think in graphs but are stuck in linear documents. People who use Obsidian, Notion, and Linear but want the connective tissue between reading, planning, and writing.</p>
            <p><strong>Local-first:</strong> The user owns their data. Offline-capable. Cloud is an extension, not a dependency.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- UX PRINCIPLES -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">III. UX_PRINCIPLES.md</h2></div>
      <div class="section-items">
        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Six design tenets</h3>
            <span class="item-badge">Stable</span>
            <p>Feed this to AI when designing components or evaluating UX decisions.</p>
          </div>
          <div class="item-body">
            <p><strong>1. Context Preservation.</strong> Opening related content must never destroy the current view. Expansions happen laterally (panels, sidebars, split views), never through destructive page navigation. The user should always be able to see where they came from.</p>

            <p><strong>2. Progressive Context Expansion.</strong> Additional context appears on demand, incrementally, anchored to the specific node or segment that triggered it. No modals. No full-page takeovers. Think: IDE peek definitions, Figma inspect panels.</p>

            <p><strong>3. Node-Centric Navigation.</strong> The atomic unit is the node (a task, a text segment, an annotation), not the page. All navigation flows node-to-node through typed edges. The user clicks a relationship and arrives at the connected node with its context already loaded.</p>

            <p><strong>4. Edge Type Drives Behavior.</strong> A <code>dependency</code> edge draws an arrow and blocks status. A <code>references</code> edge opens a lateral panel with the cited passage. A <code>translation_of</code> edge syncs scroll between two columns. The data structure is identical; the interaction layer interprets the edge type.</p>

            <p><strong>5. Blank Canvas Start.</strong> Users start from nothing and build up. No templates forced on them. No premature hierarchy (epics, milestones, sprints). They create nodes, then discover groupings organically. The system should support this emergence.</p>

            <p><strong>6. Dual Workspace.</strong> Canvas view (React Flow) for spatial/relational thinking. Document view (TipTap sidebar) for linear writing. Both views operate on the same underlying graph. Changes in one immediately reflect in the other.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- PRD -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">IV. PRD.md</h2></div>
      <div class="section-items">
        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Functional scope</h3>
            <span class="item-badge">Updates per phase</span>
            <p>Feed this to AI when building features or writing tests.</p>
          </div>
          <div class="item-body">
            <p><strong>MVP scope (Phases 1-3):</strong></p>
            <ul class="item-bullets">
              <li><strong>Graph CRUD:</strong> Create/read/update/delete nodes and edges through the UI. No direct file manipulation required — the app handles all persistence.</li>
              <li><strong>Canvas workspace:</strong> Full-screen React Flow canvas. Custom node components with Phosphor icons and status indicators. Drag to reposition. Double-click canvas to create. Draw connections between handles.</li>
              <li><strong>Typed edges:</strong> <code>dependency</code>, <code>contains</code>, <code>references</code>. Each with a registered behavior. New types addable without schema changes.</li>
              <li><strong>Document sidebar:</strong> TipTap-powered rich text editor. Opens when a node is selected. Content persists as HTML in the graph store keyed by <code>docId</code>.</li>
              <li><strong>Auto-layout:</strong> Dagre-based layout for dependency trees. Manual drag overrides. Re-layout button.</li>
              <li><strong>Export:</strong> Full graph state exportable as JSON to clipboard and filesystem.</li>
            </ul>
            <p><strong>Out of scope for MVP:</strong></p>
            <ul class="item-bullets">
              <li>Cloud sync, auth, multi-user</li>
              <li>AI-generated relations / embeddings</li>
              <li>EPUB/PDF import pipeline</li>
              <li>Translation alignment and parallel reading</li>
              <li>Real-time collaboration (Yjs/CRDTs)</li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- ARCHITECTURE -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">V. ARCHITECTURE.md</h2></div>
      <div class="section-items">
        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Stack & data model</h3>
            <span class="item-badge">Core reference</span>
            <p>Feed this to AI when writing code, debugging, or making tech decisions.</p>
          </div>
          <div class="item-body">
            <p><strong>Stack:</strong></p>
            <ul class="item-bullets">
              <li><strong>Runtime:</strong> Vite + React + TypeScript</li>
              <li><strong>Canvas:</strong> @xyflow/react (React Flow)</li>
              <li><strong>Icons:</strong> @phosphor-icons/react</li>
              <li><strong>Editor:</strong> TipTap (Phase 3)</li>
              <li><strong>State:</strong> Zustand</li>
              <li><strong>Layout:</strong> @dagrejs/dagre</li>
              <li><strong>Storage:</strong> localStorage → SQLite (via Tauri, later)</li>
              <li><strong>Desktop:</strong> Tauri (future)</li>
            </ul>

            <p><strong>Unified Graph Schema:</strong></p>
<pre style="font-size:0.78em; line-height:1.45; white-space:pre-wrap;">// Extensible — add new kinds without schema changes
type NodeKind = "phase" | "task" | "work" | "segment" | "annotation"
type EdgeKind = "dependency" | "contains" | "references"
               | "translation_of" | "commentary_on"
               | "thematic_echo" | "parallels"

type EdgeBehavior = "draw-arrow" | "expand-lateral"
                  | "sync-scroll" | "highlight-cross"
                  | "open-preview"

// Lookup: edge kind → default UI behavior
const kindToBehavior: Record&lt;EdgeKind, EdgeBehavior&gt; = {
  dependency: "draw-arrow",
  contains: "draw-arrow",
  references: "expand-lateral",
  translation_of: "sync-scroll",
  commentary_on: "expand-lateral",
  thematic_echo: "highlight-cross",
  parallels: "open-preview",
}

// Node data extends React Flow's Node
type NodeData = {
  label: string
  kind: NodeKind
  status: "pending" | "in-progress" | "done" | "active"
  docId?: string        // key into documents store
  specRef?: string      // link to docs file section
  narrativeGoal?: string // why this node exists
}

// Edge data extends React Flow's Edge
type EdgeData = {
  kind: EdgeKind
  behavior: EdgeBehavior
  label?: string
}

// Store shape
type GraphStore = {
  nodes: AppNode[]
  edges: AppEdge[]
  documents: Record&lt;string, string&gt;  // docId → HTML content
}</pre>
            <p><strong>Key architectural decision:</strong> Both Product A (roadmap) and Product B (reader) consume the same store, same schema, same React Flow canvas. What changes is which <code>NodeKind</code> and <code>EdgeKind</code> values are used, and which <code>EdgeBehavior</code> the UI renders. One codebase, two products.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- ROADMAP -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">VI. ROADMAP.md — Unified Build Sequence</h2></div>
      <div class="section-items">

        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Phase 1</h3>
            <span class="item-badge">Start here</span>
            <p>Typed foundation</p>
          </div>
          <div class="item-body">
            <p><strong>Goal: Establish the state and graph schema. No UI yet.</strong></p>
            <ul class="item-bullets">
              <li>1.1 — Define TypeScript types in <code>src/types/graph.ts</code> (NodeKind, EdgeKind, EdgeBehavior, NodeData, EdgeData, kindToBehavior map)</li>
              <li>1.2 — Set up Zustand store in <code>src/store/useGraphStore.ts</code> (nodes, edges, documents)</li>
              <li>1.3 — Implement core mutations: addNode, deleteNode, updateNodeData, addEdge, deleteEdge, updateDocument, onNodesChange, onEdgesChange</li>
              <li>1.4 — Render a bare <code>&lt;ReactFlow&gt;</code> canvas with seed data to verify the pipeline works end-to-end</li>
            </ul>
          </div>
        </article>

        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Phase 2</h3>
            <span class="item-badge">Pending</span>
            <p>Canvas workspace</p>
          </div>
          <div class="item-body">
            <p><strong>Goal: Build the visual layer. Users can see and manipulate nodes.</strong></p>
            <ul class="item-bullets">
              <li>2.1 — Custom <code>TaskNode</code> component with Phosphor icons, status badge, drag handles</li>
              <li>2.2 — Custom <code>PhaseNode</code> component as a group container with narrative goal subtitle</li>
              <li>2.3 — Double-click canvas background to create a new node at cursor position</li>
              <li>2.4 — Draw edges between node handles (React Flow's built-in connection system)</li>
              <li>2.5 — Inline editing: double-click label to rename, click status icon to cycle</li>
              <li>2.6 — Delete: select + Backspace removes node (and cascading edges) or edge</li>
              <li>2.7 — Toolbar with Phosphor icons: Add Phase, Add Task, Re-layout, Save/Export</li>
            </ul>
          </div>
        </article>

        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Phase 3</h3>
            <span class="item-badge">Pending</span>
            <p>Document sidebar + TipTap</p>
          </div>
          <div class="item-body">
            <p><strong>Goal: Dual workspace. Canvas on the left, rich text editor on the right.</strong></p>
            <ul class="item-bullets">
              <li>3.1 — Install TipTap: <code>@tiptap/react</code>, <code>@tiptap/pm</code>, <code>@tiptap/starter-kit</code></li>
              <li>3.2 — <code>DocSidebar.tsx</code>: resizable right panel, tracks <code>activeNodeId</code></li>
              <li>3.3 — Embed TipTap editor, wire <code>onUpdate</code> to debounced-save into <code>documents[docId]</code></li>
              <li>3.4 — Click a node on canvas → sidebar opens with that node's document</li>
              <li>3.5 — Auto-generate a blank document entry when a node is created (if it doesn't have one)</li>
            </ul>
          </div>
        </article>

        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Phase 4</h3>
            <span class="item-badge">Pending</span>
            <p>Layout + persistence</p>
          </div>
          <div class="item-body">
            <p><strong>Goal: Auto-layout the graph and persist state across sessions.</strong></p>
            <ul class="item-bullets">
              <li>4.1 — Dagre auto-layout utility in <code>src/utils/layoutNodes.ts</code></li>
              <li>4.2 — Re-layout button that recomputes positions without losing manual overrides</li>
              <li>4.3 — localStorage persistence: save/load full graph state on change</li>
              <li>4.4 — Export to JSON file (download) and import from JSON file (upload)</li>
              <li>4.5 — Minimap panel (React Flow built-in)</li>
            </ul>
          </div>
        </article>

        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">Phase 5</h3>
            <span class="item-badge">Future</span>
            <p>Reader product + edge behaviors</p>
          </div>
          <div class="item-body">
            <p><strong>Goal: Activate the relational reading mode using the same core.</strong></p>
            <ul class="item-bullets">
              <li>5.1 — New node kinds: <code>work</code>, <code>segment</code>, <code>annotation</code></li>
              <li>5.2 — New edge kinds: <code>references</code>, <code>translation_of</code>, <code>commentary_on</code></li>
              <li>5.3 — Implement <code>expand-lateral</code> behavior: clicking a reference edge opens the target segment in a new column</li>
              <li>5.4 — Multi-column workspace: <code>ReadingColumn</code>, <code>AnnotationColumn</code>, <code>ReferenceColumn</code></li>
              <li>5.5 — Text segmentation: import a plain text file, auto-split into paragraph-level segment nodes</li>
              <li>5.6 — Highlight + annotate: select text range → create annotation node linked to segment</li>
              <li>5.7 — Sync-scroll between translation-aligned columns</li>
            </ul>
          </div>
        </article>

      </div>
    </section>

    <hr class="report-rule">

    <!-- CLOSING -->
    <section class="report-section">
      <div class="section-header"><h2 class="section-heading">VII. README.md Hub</h2></div>
      <div class="section-items">
        <article class="report-item">
          <div class="item-label">
            <h3 class="item-title">The connector</h3>
            <p>This is the file AI reads first to understand the project structure.</p>
          </div>
          <div class="item-body">
<pre style="font-size:0.82em; line-height:1.5; white-space:pre-wrap;"># Contextual Graph Platform

A unified node-and-edge system for visual project
planning and relational reading.

## Documentation

- [VISION.md](VISION.md) — Why we're building this
- [UX_PRINCIPLES.md](UX_PRINCIPLES.md) — How it should feel
- [PRD.md](PRD.md) — What we're building (by phase)
- [ARCHITECTURE.md](ARCHITECTURE.md) — How it's built
- [ROADMAP.md](ROADMAP.md) — When we're building it

## AI Context Rule

Before starting any task, read ROADMAP.md to locate
where we are. Then read the relevant PRD section for
the active phase. Use ARCHITECTURE.md for all code
decisions. Refer to UX_PRINCIPLES.md when designing
any interaction.</pre>
          </div>
        </article>
      </div>
    </section>

  </main>

</div></div>

<!-- Settings panel -->
<div class="settings-wrap">
  <div class="settings-panel" id="settingsPanel">
    <div class="settings-header">Customize Report</div>
    <div class="settings-swatches" id="settingsSwatches"></div>
    <div class="settings-fonts" id="settingsFonts"></div>
  </div>
  <button class="settings-btn" id="settingsBtn" title="Customize">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  </button>
</div>

<script id="report-data" type="application/json">{"date":"2026-05-13T14:33:37Z","colorIndex":2,"fontIndex":2}</script>
<script src="app.js"></script>