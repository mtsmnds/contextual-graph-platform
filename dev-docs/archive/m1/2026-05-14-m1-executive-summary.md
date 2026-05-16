<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>M1 — Domain Engine | Milestone Summary</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #f8f9fa; line-height: 1.6; }
  .slide { max-width: 960px; margin: 0 auto; padding: 64px 48px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
  .slide + .slide { border-top: 1px solid #e0e0e0; }
  h1 { font-size: 2.4rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
  h2 { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 24px; color: #333; }
  h3 { font-size: 1.1rem; font-weight: 600; margin: 24px 0 12px; color: #555; }
  .subtitle { font-size: 1.1rem; color: #666; margin-bottom: 48px; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .tag.done { background: #d4edda; color: #155724; }
  .tag.decision { background: #fff3cd; color: #856404; }
  .tag.learning { background: #e8f4f8; color: #1565C0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
  .card { background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 24px; }
  .card h3 { margin-top: 0; }
  .card .stat { font-size: 2rem; font-weight: 700; color: #1a1a2e; }
  .card .stat-label { font-size: 0.85rem; color: #666; margin-top: 2px; }
  .prd-list { list-style: none; margin: 16px 0; }
  .prd-list li { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; }
  .prd-list li:last-child { border-bottom: none; }
  .prd-list a { color: #1565C0; text-decoration: none; font-weight: 500; }
  .prd-list a:hover { text-decoration: underline; }
  .prd-list .date { font-size: 0.8rem; color: #999; white-space: nowrap; }
  .decision-list { margin: 16px 0; }
  .decision-list li { padding: 12px 16px; margin-bottom: 8px; background: #fff; border-left: 4px solid #ffc107; border-radius: 0 8px 8px 0; list-style: none; }
  .decision-list li strong { display: block; color: #333; }
  .decision-list li span { font-size: 0.9rem; color: #555; }
  .architecture { background: #f0f0f0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; font-family: monospace; font-size: 1.1rem; line-height: 2; }
  .architecture .arrow { color: #999; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 24px 0; }
  .two-col h3 { margin-top: 0; }
  ul { padding-left: 20px; }
  ul li { margin-bottom: 8px; }
  .footer-nav { margin-top: 48px; padding-top: 24px; border-top: 1px solid #ddd; font-size: 0.9rem; color: #999; text-align: center; }
  @media (max-width: 700px) { .slide { padding: 32px 24px; } .grid { grid-template-columns: 1fr; } .two-col { grid-template-columns: 1fr; } }
</style>
</head>
<body>

<!-- Slide 1: Title -->
<div class="slide" style="text-align:center;">
  <h1 style="font-size:3rem;">M1 — Domain Engine</h1>
  <p class="subtitle" style="font-size:1.3rem;">A relation-native content graph platform<br>May 13–14, 2026</p>
  <div style="margin-top:48px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
    <span class="tag done">9 PRDs completed</span>
    <span class="tag done">~1,400 entities</span>
    <span class="tag done">~2,700 relations</span>
    <span class="tag done">File System persistence</span>
  </div>
</div>

<!-- Slide 2: What is it? -->
<div class="slide">
  <h2>What we built</h2>
  <p class="subtitle">The core is a typed Entity/Relation graph. Everything else is a projection.</p>

  <div class="architecture">
    <strong style="color:#1a1a2e;">graph.json</strong><br>
    <span class="arrow">↓</span><br>
    <strong style="color:#1565C0;">Entity Graph</strong><br>
    <span style="color:#999;">(typed nodes + typed edges)</span><br>
    <span class="arrow">↓</span><br>
    <strong style="color:#1565C0;">Query Engine</strong><br>
    <span style="color:#999;">(getEntity, getContainerChildren, getLinkedContext, …)</span><br>
    <span class="arrow">↓</span><br>
    <strong style="color:#1565C0;">Renderer</strong><br>
    <span style="color:#999;">(reading viewport, columns, graph canvas — future)</span>
  </div>

  <p style="margin-top:24px;">A work like Hamlet is imported once, stored as entities + relations in a plain JSON file on the user's filesystem. The app is a viewer/editor for that file — no hidden state, no database, no server.</p>
</div>

<!-- Slide 3: By the numbers -->
<div class="slide">
  <h2>By the numbers</h2>
  <div class="grid">
    <div class="card"><div class="stat">9</div><div class="stat-label">PRDs executed</div></div>
    <div class="card"><div class="stat">1,359</div><div class="stat-label">entities in Hamlet data</div></div>
    <div class="card"><div class="stat">2,699</div><div class="stat-label">relations in Hamlet data</div></div>
    <div class="card"><div class="stat">425 KB</div><div class="stat-label">JS bundle (was 968 KB with seed data)</div></div>
    <div class="card"><div class="stat">1,132</div><div class="stat-label">character speeches cleaned of duplicate title</div></div>
    <div class="card"><div class="stat">3</div><div class="stat-label">navigation modes planned (page, tree, graph)</div></div>
  </div>
</div>

<!-- Slide 4: Architecture decisions -->
<div class="slide">
  <h2>Key decisions</h2>
  <ol class="decision-list">
    <li>
      <strong>IDs are semantic and immutable</strong>
      <span>An ID like <code>hamlet_act-01_scene-01_seg-0001</code> tells you the entity's place in the graph. Once assigned, never recalculated — renaming "Act I" to "Act One" doesn't change child IDs.</span>
    </li>
    <li>
      <strong>Containers are structural (no content)</strong>
      <span>Containers have a <code>title</code> and <code>metadata</code> but never inline content. Content lives in child segments. Applied to 20 scenes, dramatis-personae, title page, end-matter.</span>
    </li>
    <li>
      <strong>Segments never have a <code>title</code> field</strong>
      <span>Character speeches use <code>metadata.character</code>. Structural segments use <code>metadata.type</code>. Annotations are the exception (card heading). 1,132 segments cleaned.</span>
    </li>
    <li>
      <strong>The filesystem is the source of truth</strong>
      <span>File System Access API — user picks a folder, app reads/writes <code>graph.json</code>. No localStorage, no hidden state. The file is plain JSON — diff it with git, edit it in any editor.</span>
    </li>
    <li>
      <strong>No runtime data manipulation</strong>
      <span>The store never modifies data after loading. Content matching, source detection, annotation merging — all removed. What's in the file is what you get.</span>
    </li>
    <li>
      <strong>Three navigation modes replace canvas-as-default</strong>
      <span>The React Flow canvas was the first page but "helped very little." Moving forward: page view (default), tree sidebar, graph viz — each URL-addressable (<code>?view=page</code>, <code>?view=tree</code>, <code>?view=graph</code>).</span>
    </li>
  </ol>
</div>

<!-- Slide 5: The data model -->
<div class="slide">
  <h2>The data model — in practice</h2>
  <p class="subtitle">Every entity has a <code>kind</code> (container / segment / annotation / concept / summary), a semantic <code>id</code>, optional <code>title</code> and <code>content</code>, and <code>metadata</code> for rendering hints.</p>

  <div class="two-col">
    <div>
      <h3>Container</h3>
      <pre style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:0.8rem; overflow-x:auto;">{
  "id": "hamlet_act-01",
  "kind": "container",
  "title": "Act I",
  "metadata": {
    "type": "act",
    "source": "hamlet"
  }
}</pre>
    </div>
    <div>
      <h3>Segment (character speech)</h3>
      <pre style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:0.8rem; overflow-x:auto;">{
  "id": "seg_18",
  "kind": "segment",
  "content": "Who's there?",
  "metadata": {
    "character": "BARNARDO",
    "source": "hamlet"
  }
}</pre>
    </div>
  </div>

  <p style="margin-top:16px; font-size:0.9rem; color:#666;">The <code>contains</code> relation encodes hierarchy. The <code>next</code> relation encodes reading order. <code>annotates</code> and <code>references</code> link context.</p>
</div>

<!-- Slide 6: Learnings -->
<div class="slide">
  <h2>Hard-won learnings</h2>

  <div class="grid">
    <div class="card">
      <h3>Content matching is dangerous</h3>
      <p style="font-size:0.9rem; color:#555;">The original annotation seed data tried to find segments by matching text content at runtime. A single curly quote (U+2019 vs U+0027) broke the match silently. Only "To be, or not to be" worked — by accident (no apostrophes in the search term). <strong>Fix:</strong> embed annotations directly in the data file.</p>
    </div>
    <div class="card">
      <h3>Sort order determines padding</h3>
      <p style="font-size:0.9rem; color:#555;">Without zero-padding (<code>seg-1</code>, <code>seg-10</code>, <code>seg-100</code>), alphabetical sort breaks reading order. Zero-padded <code>seg-0001</code> → <code>seg-9999</code> sorts correctly in every editor and tool. The cost: slightly longer IDs and a 9999 cap per parent (more than enough).</p>
    </div>
    <div class="card">
      <h3>Delete and rename must handle relations</h3>
      <p style="font-size:0.9rem; color:#555;">Deleting <code>seg_8</code> required removing 3 relations and adding a new <code>next</code> to repair the chain. Renaming 6 entities required 38 relation reference updates. <strong>Fix:</strong> store now cascades deletes and propagates renames automatically.</p>
    </div>
    <div class="card">
      <h3>Containers with content are inconsistent</h3>
      <p style="font-size:0.9rem; color:#555;">Scenes, dramatis-personae, and end-matter all had inline content AND child segments. Two sources of truth for content. <strong>Fix:</strong> containers are structural only. Content always lives in child segments. 20 scenes + 3 containers restructured.</p>
    </div>
  </div>
</div>

<!-- Slide 7: What was built (PRDs) -->
<div class="slide">
  <h2>Execution log</h2>
  <ul class="prd-list">
    <li><span class="date">2026-05-13</span> <a href="archive/2026-05-13-prd0002-domain-engine-refactor.md">PRD0002 — Domain Engine Refactor</a> — Entity/Relation schema, query engine, seed data</li>
    <li><span class="date">2026-05-13</span> <a href="archive/2026-05-13-prd0003-persistence-layer.md">PRD0003 — Persistence Layer</a> — localStorage auto-save, export/import</li>
    <li><span class="date">2026-05-13</span> <a href="archive/2026-05-13-prd0004-reading-viewport.md">PRD0004 — Reading Viewport</a> — focused entity display, prev/next nav</li>
    <li><span class="date">2026-05-13</span> <a href="archive/2026-05-13-prd0005-continuous-scroll-viewport.md">PRD0005 — Continuous Scroll Viewport</a> — container-aware rendering, segment variants</li>
    <li><span class="date">2026-05-13</span> <a href="archive/2026-05-13-prd0006-hamlet-import.md">PRD0006 — Hamlet Import</a> — Gutenberg parser, 1,342 entities, 2,634 relations</li>
    <li><span class="date">2026-05-14</span> <a href="archive/2026-05-14-prd0008-pure-domain-loader.md">PRD0008 — Pure Domain Loader</a> — stripped runtime merging from data loading</li>
    <li><span class="date">2026-05-14</span> <a href="archive/2026-05-14-prd0009-file-system-persistence.md">PRD0009 — File System Persistence</a> — graph.json on user's filesystem, no localStorage</li>
    <li><span class="date">2026-05-14</span> <a href="archive/2026-05-14-prd0011-handle-persistence-and-url-navigation.md">PRD0011 — Handle Persistence &amp; URL Navigation</a> — IndexedDB handle, URL view state sync</li>
    <li><span class="date">2026-05-14</span> <a href="plans/prd0010-1-minimal-entity-model.md">PRD0010-1 — Minimal Entity Model</a> — ID scheme, model rules, HTML content</li>
  </ul>
</div>

<!-- Slide 8: Architecture -->
<div class="slide">
  <h2>System architecture</h2>
  <div class="two-col">
    <div>
      <h3>Core files</h3>
      <ul style="font-size:0.9rem;">
        <li><code>src/types/graph.ts</code> — Entity, Relation, ViewState, GraphSnapshot types</li>
        <li><code>src/store/useGraphStore.ts</code> — Zustand store with FS persistence + model rules</li>
        <li><code>src/engine/queries.ts</code> — getEntity, getContainerChildren, getLinkedContext, resolveContainer</li>
        <li><code>src/engine/ids.ts</code> — slugify, generateEntityId, collision handling</li>
        <li><code>src/renderers/ReadingViewport.tsx</code> — continuous-scroll reading viewport</li>
        <li><code>src/App.tsx</code> — folder picker gate, canvas bridge, header</li>
      </ul>
    </div>
    <div>
      <h3>Key design properties</h3>
      <ul style="font-size:0.9rem;">
        <li>Domain types import nothing from rendering (React Flow agnostic)</li>
        <li>View state separate from domain state</li>
        <li>Query engine is pure functions — no hooks, no components</li>
        <li>Data is a flat JSON file — no database, no server</li>
        <li>IDs encode containment path — self-documenting</li>
        <li>Content supports HTML — TipTap integration is next</li>
      </ul>
    </div>
  </div>
</div>

<!-- Slide 9: What M1 unlocks -->
<div class="slide">
  <h2>What M1 unlocks for M2</h2>
  <div class="grid">
    <div class="card">
      <div class="stat">Node component</div>
      <div class="stat-label">The atomic building block for all renderers — segment and container types with action icons in the border area.</div>
    </div>
    <div class="card">
      <div class="stat">Context columns</div>
      <div class="stat-label">Horizontal navigation through related context (work → author → reference). Start with 3 columns, design for unlimited horizontal scroll.</div>
    </div>
    <div class="card">
      <div class="stat">TipTap integration</div>
      <div class="stat-label">Rich text rendering + editing. Per-node vs whole-container editing. Unlocks annotation creation.</div>
    </div>
    <div class="card">
      <div class="stat">Page view (default)</div>
      <div class="stat-label">Home page listing root containers. No more canvas-as-default. Three navigation modes: page, tree, graph.</div>
    </div>
  </div>
  <p style="margin-top:24px; font-size:0.9rem; color:#666;">See the full roadmap at <code>dev-docs/roadmap.md</code> for detailed phase planning.</p>
</div>

<div class="footer-nav">
  <p>Presentation prepared for executive review · May 14, 2026</p>
  <p style="font-size:0.8rem;">All numbers from hello2/graph.json restructuring — validated against Hamlet Acts I–V, all scenes and speeches</p>
</div>

</body>
</html>
