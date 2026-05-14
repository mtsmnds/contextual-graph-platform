<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Plan v3: Popover Sidebar — No Header, Top-Level Nodes</title>
<style>
  :root {
    --bg: #fff;
    --fg: #18181b;
    --muted: #71717a;
    --muted-2: #a1a1aa;
    --border: #e4e4e7;
    --accent-bg: #f4f4f5;
    --popover-bg: #fff;
    --popover-fg: #18181b;
    --sidebar-accent-bg: #e8e8ec;
    --sidebar-fg: #18181b;
    --radius: 0.5rem;
    --sidebar-width: 14rem;
    font-family: 'Geist Variable', system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    color: var(--fg);
    background: var(--bg);
  }
  body { margin: 0; padding: 32px; max-width: 1000px; }

  h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.25rem; }
  h2 { font-size: 1.15rem; font-weight: 600; margin: 2rem 0 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
  .subtitle { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem; }

  /* --- App Shell --- */
  .app-shell {
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1.5);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    margin: 1rem 0;
    position: relative;
    background: var(--bg);
    height: 440px;
  }

  /* NO HEADER — content fills shell directly */
  .app-content {
    height: 100%;
    overflow-y: auto;
    background: var(--bg);
    padding: 2.5rem 2rem;
    box-sizing: border-box;
  }

  /* --- Card-based reading viewport --- */
  .card-area {
    max-width: 720px;
    margin: 0 auto;
  }

  .card {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  .card:hover {
    background: var(--accent-bg);
  }
  .card:first-child {
    padding-top: 0;
  }

  .card-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted-2);
    margin-bottom: 0.25rem;
  }

  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
    line-height: 1.3;
  }

  .card-content {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--fg);
  }
  .card-content.muted {
    color: var(--muted);
  }

  .card-metadata {
    font-size: 0.75rem;
    color: var(--muted-2);
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .card-separator {
    height: 1.5rem;
  }

  /* Act heading */
  .act-heading {
    padding: 1.5rem 1.5rem 0.5rem;
    border-bottom: none;
  }
  .act-heading hr {
    border: none;
    border-top: 1px solid var(--border);
    margin-bottom: 1rem;
  }
  .act-heading .card-title {
    font-size: 1.3rem;
  }

  /* Scene heading */
  .scene-heading {
    padding: 1rem 1.5rem 0.5rem;
  }
  .scene-heading .card-title {
    font-size: 1.05rem;
    font-weight: 500;
  }

  /* Stage direction */
  .stage-dir {
    font-style: italic;
    color: var(--muted);
  }

  /* Speech card */
  .speech-card .speaker {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }
  .speech-card .card-content p {
    margin: 0.25rem 0;
  }

  /* --- Floating three-dots button (replaces header) --- */
  .floating-dots {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: calc(var(--radius) * 0.5);
    color: var(--muted-2);
    transition: all 0.15s;
  }
  .floating-dots:hover,
  .floating-dots.active {
    background: var(--accent-bg);
    color: var(--fg);
  }

  /* --- Popover (below the floating button) --- */
  .popover-portal {
    position: absolute;
    z-index: 50;
    top: 2.5rem;
    right: 0.5rem;
  }

  .popover-content {
    display: flex;
    flex-direction: column;
    width: var(--sidebar-width);
    overflow: hidden;
    border-radius: calc(var(--radius) * 0.8);
    background: var(--popover-bg);
    font-size: 0.875rem;
    color: var(--popover-fg);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
    outline: none;
    opacity: 0;
    transform-origin: top right;
    transition: opacity 0.12s, transform 0.12s;
    pointer-events: none;
  }
  .popover-content.open {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar-in-popover {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: transparent;
    color: var(--sidebar-fg);
    max-height: 380px;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    min-height: 0;
  }

  /* Group */
  .sidebar-group {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    padding: 0.375rem;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-group:last-child { border-bottom: none; }

  .sidebar-group-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted-2);
    padding: 0.25rem 0.5rem 0.25rem;
  }

  .sidebar-group-content {
    width: 100%;
    font-size: 0.875rem;
  }

  .sidebar-menu {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    gap: 0;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .sidebar-menu-item {
    position: relative;
    list-style: none;
  }

  .sidebar-menu-btn {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
    border-radius: calc(var(--radius) * 0.5);
    padding: 0.4rem 0.5rem;
    text-align: left;
    font-size: 0.8rem;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--sidebar-fg);
    transition: background 0.1s;
  }
  .sidebar-menu-btn:hover {
    background: var(--sidebar-accent-bg);
  }
  .sidebar-menu-btn.selected {
    background: var(--sidebar-accent-bg);
    font-weight: 500;
  }
  .sidebar-menu-btn svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: var(--muted);
  }
  .sidebar-menu-btn > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Folder status footer in popover */
  .popover-footer {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border-top: 1px solid var(--border);
    font-size: 0.7rem;
    color: var(--muted-2);
  }
  .popover-footer .save-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
  }
  .popover-footer .folder-icon {
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
    color: var(--muted-2);
  }

  /* --- Callouts --- */
  .callout {
    background: #f0f4ff;
    border-left: 3px solid #3b82f6;
    padding: 0.75rem 1rem;
    border-radius: calc(var(--radius) * 0.6);
    font-size: 0.85rem;
    margin: 0.75rem 0;
  }
  .callout-warn { background: #fefce8; border-left-color: #eab308; }
  .callout-green { background: #f0fdf4; border-left-color: #22c55e; }

  code {
    background: var(--accent-bg);
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }

  hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #18181b;
      --fg: #fafafa;
      --muted: #a1a1aa;
      --muted-2: #71717a;
      --border: #27272a;
      --accent-bg: #27272a;
      --popover-bg: #1f1f23;
      --popover-fg: #fafafa;
      --sidebar-accent-bg: #2a2a30;
      --sidebar-fg: #fafafa;
    }
    .callout { background: #1e293b; border-left-color: #3b82f6; }
    .callout-warn { background: #2f2a1a; border-left-color: #eab308; }
    .callout-green { background: #1a2e1a; border-left-color: #22c55e; }
    .popover-content {
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
    }
  }
</style>
</head>
<body>

<p class="subtitle" style="font-size:0.7rem;color:var(--muted-2);margin-bottom:0;">PRD0012 — M2 Phase 1 &middot; 2026-05-14 &middot; Status: <strong style="color:#22c55e;">Complete</strong></p>

<!-- ============================================ -->
<!-- COMPLETION NOTE / ADR -->
<!-- ============================================ -->
<h2 style="border:none;margin-top:0.5rem;">ADR: Implementation Fixes</h2>

<div class="callout callout-warn">
  <strong>The first implementation of this plan failed at runtime.</strong> Two errors surfaced when the shadcn Sidebar was rendered inside the Popover:
</div>

<h3>Context</h3>
<p>The plan called for <code>Popover → Sidebar(collapsible="none")</code>, which was implemented inline in <code>App.tsx</code>. On first render, two errors appeared: the sidebar threw <code>useSidebar must be used within a SidebarProvider</code>, and React Flow threw <code>parent container needs width and height</code>.</p>

<h3>Root causes</h3>
<ol>
  <li><strong>Missing SidebarProvider.</strong> The shadcn <code>SidebarMenuButton</code> calls <code>useSidebar()</code> internally — this requires a <code>SidebarProvider</code> ancestor in the React tree. The plan's pattern code omitted it.</li>
  <li><strong>SidebarProvider's layout wrapper.</strong> <code>SidebarProvider</code> renders <code>&lt;div data-slot="sidebar-wrapper" class="flex min-h-svh w-full ..."&gt;</code>. Wrapping the app content in this flex container broke the <code>h-screen</code> sizing that React Flow's parent container requires.</li>
</ol>

<h3>Decision</h3>
<ul>
  <li><strong>Wrap App return with <code>&lt;SidebarProvider&gt;</code></strong> — satisfies the <code>useSidebar</code> contract.</li>
  <li><strong>Pass <code>className="contents"</code> to SidebarProvider</strong> — makes the wrapper div a layout no-op (<code>display: contents</code>) so it only provides React context without affecting the CSS box model. React Flow's parent container keeps its <code>h-screen</code> sizing.</li>
</ul>

<h3>Alternatives considered</h3>
<ul>
  <li><strong>Wrap only SidebarPopover with a local provider</strong> — would fix the sidebar error but less future-proof if other components need sidebar context. Also doesn't help if Sidebar is rendered in a portal (PopoverContent teleports).</li>
  <li><strong>Bypass useSidebar entirely</strong> — could pass sidebar state as props instead, but defeats the purpose of using shadcn sidebar primitives and their built-in keyboard shortcuts.</li>
  <li><strong>Restructure layout to fit SidebarProvider's flex</strong> — possible but unnecessary when <code>contents</code> achieves the same effect with zero layout changes.</li>
</ul>

<h3>Consequences</h3>
<ul>
  <li>Sidebar works correctly — menu items navigate to root containers, footer shows folder name and save status.</li>
  <li>React Flow canvas renders at full viewport height — no regression.</li>
  <li><code>display: contents</code> has excellent browser support (97%+). No accessibility impact since the SidebarProvider is a semantic wrapper, not an interactive element.</li>
  <li>Future developers must remember to wrap any <code>Sidebar</code> usage with <code>SidebarProvider className="contents"</code> when the sidebar is used outside a traditional sidebar-layout context.</li>
</ul>

<h3>PRD Sequential Code</h3>
<pre style="background:var(--accent-bg);padding:0.75rem;border-radius:calc(var(--radius)*0.6);font-size:0.8rem;line-height:1.5;">
PRD0012 — Popover Sidebar Navigation (M2 Phase 1)

Step 1 — Initial implementation (failed):
  - App.tsx: Added SidebarPopover with shadcn Popover + Sidebar primitives
  - Error 1: "useSidebar must be used within a SidebarProvider"
  - Error 2: React Flow "parent container needs width and height"

Step 2 — Fix SidebarProvider missing:
  - Added &lt;SidebarProvider&gt; wrapping the App return
  - Error 2 still present — SidebarProvider's flex layout breaks parent sizing

Step 3 — Fix layout conflict:
  - Changed to &lt;SidebarProvider className="contents"&gt;
  - Both errors resolved. Build: ✅, TypeScript: ✅
</pre>

<div class="callout callout-green">
  <strong>Files changed (fix round):</strong>
  <ul style="margin:0.25rem 0 0;">
    <li><code>src/App.tsx</code> — imported <code>SidebarProvider</code>, wrapped app return, added <code>className="contents"</code></li>
  </ul>
</div>

<h1>Phase 1 Plan v3: No Header, Top-Level Nodes</h1>
<p class="subtitle">Milestone 2 — Reading Workspace &middot; 2026-05-14</p>

<!-- ============================================ -->
<!-- PATTERN -->
<!-- ============================================ -->
<h2>Pattern</h2>

<pre style="background:var(--accent-bg);padding:1rem;border-radius:calc(var(--radius)*0.6);font-size:0.8rem;overflow-x:auto;line-height:1.6;">
{`<Popover open={sidebarOpen} onOpenChange={setSidebarOpen}>
  {/* Floating three-dots button — no header */}
  <PopoverTrigger render={
    <Button variant="ghost" size="icon-sm"
            className="h-7 w-7 data-[state=open]:bg-accent
                       fixed top-2 right-2 z-40">
      <MoreHorizontal />
    </Button>
  } />

  <PopoverContent className="w-56 overflow-hidden rounded-lg p-0"
                  align="end" side="bottom" sideOffset={4}>
    <Sidebar collapsible="none" className="bg-transparent">
      <SidebarContent>
        {/* Root-level containers as flat menu items */}
        <SidebarGroup className="border-b last:border-none">
          <SidebarGroupContent className="gap-0">
            <SidebarMenu>
              {rootContainers.map((entity) => (
                <SidebarMenuItem key={entity.id}>
                  <SidebarMenuButton onClick={() => focusEntity(entity.id)}>
                    <BookOpen /> <span>{entity.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions group */}
        <SidebarGroup>
          <SidebarGroupContent className="gap-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={...}>
                  <Plus /> <span>New Entity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Folder + save status in sidebar footer */}
      <SidebarFooter className="border-t px-3 py-2
        flex-row items-center gap-1.5 text-xs text-muted-foreground">
        <Folder /> my-project • <span className="size-1.5 rounded-full bg-green-500" /> Saved
      </SidebarFooter>
    </Sidebar>
  </PopoverContent>
</Popover>`}
</pre>

<!-- ============================================ -->
<!-- PROTOTYPE -->
<!-- ============================================ -->
<h2>Prototype</h2>
<p>No header. The <strong>⋯</strong> floats in the top-right corner. Click it to open the sidebar — root-level entities only, flat list, no expand/collapse. The content area shows a card-based reading viewport.</p>

<div class="app-shell" id="appShell">

  <!-- Floating three-dots button (no header!) -->
  <button class="floating-dots" id="popoverTrigger" title="Open sidebar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  </button>

  <!-- Content area — card-based reading viewport, no header -->
  <div class="app-content" id="appContent">
    <div class="card-area">

      <!-- Work heading -->
      <div class="card act-heading">
        <hr />
        <div class="card-label">Work</div>
        <div class="card-title">Hamlet, Prince of Denmark</div>
        <div class="card-metadata">
          <span>by William Shakespeare</span>
        </div>
      </div>

      <div class="card-separator"></div>

      <!-- Act I heading -->
      <div class="card act-heading">
        <hr />
        <div class="card-title">ACT I</div>
      </div>

      <!-- Scene I heading -->
      <div class="card scene-heading">
        <div class="card-title">SCENE I. Elsinore. A platform before the castle.</div>
        <div class="card-content muted">Elsinore. A platform before the castle.</div>
      </div>

      <!-- Speech: Bernardo -->
      <div class="card speech-card">
        <div class="speaker">Bernardo</div>
        <div class="card-content">
          <p>Who's there?</p>
        </div>
      </div>

      <!-- Speech: Francisco -->
      <div class="card speech-card">
        <div class="speaker">Francisco</div>
        <div class="card-content">
          <p>Nay, answer me: stand, and unfold yourself.</p>
        </div>
      </div>

      <!-- Speech: Bernardo -->
      <div class="card speech-card">
        <div class="speaker">Bernardo</div>
        <div class="card-content">
          <p>Long live the king!</p>
        </div>
      </div>

      <!-- Speech: Francisco -->
      <div class="card speech-card">
        <div class="speaker">Francisco</div>
        <div class="card-content">
          <p>Bernardo?</p>
        </div>
      </div>

      <!-- Speech: Bernardo -->
      <div class="card speech-card">
        <div class="speaker">Bernardo</div>
        <div class="card-content">
          <p>He.</p>
        </div>
      </div>

      <!-- Stage direction -->
      <div class="card stage-dir">
        <div class="card-content">Enter Horatio and Marcellus.</div>
      </div>

      <!-- Annotation indicator -->
      <div class="card speech-card">
        <div class="speaker">Marcellus</div>
        <div class="card-content">
          <p>Friends to this ground.</p>
        </div>
        <div class="card-metadata">
          <span style="display:flex;align-items:center;gap:0.25rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            1 annotation
          </span>
        </div>
      </div>

    </div>
  </div>

  <!-- Popover -->
  <div class="popover-portal" id="popoverPortal">
    <div class="popover-content" id="popoverContent">
      <div class="sidebar-in-popover">
        <div class="sidebar-content" id="sidebarContent">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  </div>
</div>

<p style="font-size:0.8rem;color:var(--muted);margin-top:0.25rem;">
  ↑ Click ⋯ to open. Root-level entities only — flat list, no tree. Folder + save status in the footer. Escape or outside click to close.
</p>

<!-- ============================================ -->
<!-- IMPLEMENTATION IMPACT -->
<!-- ============================================ -->
<h2>What this means for the codebase</h2>

<div class="callout">
  <strong>AppHeader is deleted.</strong> The header component in <code>App.tsx</code> (~27 lines) goes away entirely. Its contents relocate:
  <ul style="margin:0.5rem 0 0;">
    <li><strong>Folder name + save status</strong> → into the popover sidebar footer (via <code>SidebarFooter</code>)</li>
    <li><strong>Three-dots trigger</strong> → floating button in the top-right corner of the viewport</li>
    <li><strong>Breadcrumb</strong> → removed (the ReadingViewport's own breadcrumb header remains for now; titles will naturally show in cards)</li>
    <li><strong>Close (X) button</strong> in ReadingViewport header → can be part of the card layout or a floating element</li>
  </ul>
</div>

<h3>Modified files</h3>
<table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin:0.5rem 0;">
  <tr style="border-bottom:1px solid var(--border);">
    <th style="text-align:left;padding:0.3rem 0.5rem;">File</th>
    <th style="text-align:left;padding:0.3rem 0.5rem;">Change</th>
  </tr>
  <tr style="border-bottom:1px solid var(--border);">
    <td style="padding:0.3rem 0.5rem;"><code>src/App.tsx</code></td>
    <td style="padding:0.3rem 0.5rem;">Delete <code>AppHeader</code>, delete the <code>AppHeader</code> call. Add <code>SidebarPopover</code> with floating trigger. The layout becomes just <code>SidebarPopover + {content}</code>.</td>
  </tr>
  <tr style="border-bottom:1px solid var(--border);">
    <td style="padding:0.3rem 0.5rem;"><code>src/renderers/ReadingViewport.tsx</code></td>
    <td style="padding:0.3rem 0.5rem;">Remove the <code>&lt;header&gt;</code> with the X button and breadcrumb. The close (back to canvas) goes away or moves to a floating button. The breadcrumb becomes inline in the card area.</td>
  </tr>
</table>

<h3>New files</h3>
<table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin:0.5rem 0;">
  <tr style="border-bottom:1px solid var(--border);">
    <th style="text-align:left;padding:0.3rem 0.5rem;">File</th>
    <th style="text-align:left;padding:0.3rem 0.5rem;">Role</th>
  </tr>
  <tr style="border-bottom:1px solid var(--border);">
    <td style="padding:0.3rem 0.5rem;"><code>src/components/SidebarPopover.tsx</code></td>
    <td style="padding:0.3rem 0.5rem;">Owns open/close state. Renders: PopoverTrigger (floating dots) → PopoverContent → Sidebar(collapsible="none") → root containers as SidebarMenu items + SidebarFooter with folder/save.</td>
  </tr>
  <tr style="border-bottom:1px solid var(--border);">
    <td style="padding:0.3rem 0.5rem;"><code>src/hooks/useRootContainers.ts</code></td>
    <td style="padding:0.3rem 0.5rem;">Returns root-level containers (entities that have no incoming "contains" relation). Simple filter. Could be inlined in the component but extracted for clarity.</td>
  </tr>
</table>

<h3>Layout before/after</h3>
<pre style="background:var(--accent-bg);padding:0.75rem;border-radius:calc(var(--radius)*0.6);font-size:0.8rem;line-height:1.5;">
Before:                After:
┌─AppHeader──────────┐ ┌──⋯─────────────────┐
│ folder  breadcrumb │ │                     │
│         ⋯  ●Saved  │ │                     │
├────────────────────┤ │   Card-based        │
│                    │ │   content           │
│ ReadingViewport    │ │   (full height,     │
│ or CanvasView      │ │   no outer chrome)  │
│                    │ │                     │
└────────────────────┘ └─────────────────────┘
</pre>

<!-- ============================================ -->
<!-- DECISIONS -->
<!-- ============================================ -->
<h2>Open decisions</h2>

<h3>1. Where does "close" go?</h3>
<p>The current ReadingViewport has an X button that returns to the canvas. Without a header, this could:</p>
<ul style="font-size:0.85rem;">
  <li><strong>Float near the dots button</strong> — two floating buttons in the top-right corner (X to go back to canvas/splash, ⋯ for sidebar)</li>
  <li><strong>Be a keyboard shortcut only</strong> (Escape to close reading viewport)</li>
  <li><strong>Live inside the sidebar popover</strong> — an action in the Actions group</li>
</ul>

<h3>2. Folder picker flow — no header means what?</h3>
<p style="font-size:0.85rem;">Before a folder is picked, we show a full-screen <code>FolderPicker</code>. Once a folder is loaded, the three-dots button appears. The folder name lives in the popover footer — so the user can always find it. This is fine.</p>

<h3>3. Entity icons in the sidebar?</h3>
<p style="font-size:0.85rem;">Each root container gets a contextual icon. Works get <code>BookOpen</code>, roadmaps get <code>Map</code>, note collections get <code>StickyNote</code>. The icon is determined by <code>metadata.type</code> or entity <code>kind</code>.</p>

<h3>4. What about the Canvas view "close" flow?</h3>
<p style="font-size:0.85rem;">Currently, clicking X in the ReadingViewport header returns to the Canvas view. Without a header, the Canvas view becomes harder to reach. The sidebar popover can have a "Canvas View" item in the Navigate group. Or the canvas becomes the view you see when no entity is focused (the current behavior).</p>

<script>
// --- Root-level entity data ---
const rootContainers = [
  { id: 'hamlet--william-shakespeare', label: 'Hamlet, Prince of Denmark', kind: 'container', type: 'work', icon: 'book' },
  { id: 'my-roadmap', label: 'Project Roadmap', kind: 'container', type: 'roadmap', icon: 'map' },
  { id: 'reference-notes', label: 'Reference Notes', kind: 'container', type: 'notes', icon: 'note' },
];

const actionItems = [
  { id: 'new-entity', label: 'New Entity', icon: 'plus' },
  { id: 'canvas-view', label: 'Canvas View', icon: 'layout' },
];

// Icon SVGs
const icons = {
  book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  map: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
  note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  layout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>',
  folder: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
};

// --- Render sidebar groups ---
function renderMenu(label, items, ctx) {
  const group = document.createElement('div');
  group.className = 'sidebar-group';

  if (label) {
    const lbl = document.createElement('div');
    lbl.className = 'sidebar-group-label';
    lbl.textContent = label;
    group.appendChild(lbl);
  }

  const gContent = document.createElement('div');
  gContent.className = 'sidebar-group-content';

  const menu = document.createElement('ul');
  menu.className = 'sidebar-menu';

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'sidebar-menu-item';

    const btn = document.createElement('button');
    btn.className = 'sidebar-menu-btn';
    btn.dataset.id = item.id;

    // Icon
    const iconSvg = icons[item.icon] || icons.book;
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = iconSvg;
    btn.appendChild(iconSpan.firstElementChild);

    // Label
    const labelSpan = document.createElement('span');
    labelSpan.textContent = item.label;
    btn.appendChild(labelSpan);

    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-menu-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('contentLabel').textContent = `Navigated to: ${item.label}`;
      closePopover();
    });

    li.appendChild(btn);
    menu.appendChild(li);
  }

  gContent.appendChild(menu);
  group.appendChild(gContent);
  return group;
}

function renderSidebar() {
  const container = document.getElementById('sidebarContent');
  container.innerHTML = '';

  // Entities group
  container.appendChild(renderMenu('Entities', rootContainers));

  // Actions group
  container.appendChild(renderMenu(null, actionItems));

  // Footer
  const footer = document.createElement('div');
  footer.className = 'popover-footer';
  footer.innerHTML = `
    <span class="folder-icon">${icons.folder}</span>
    my-project
    <span style="margin-left:auto;display:flex;align-items:center;gap:0.25rem;">
      <span class="save-dot"></span>
      Saved
    </span>
  `;
  container.appendChild(footer);
}

renderSidebar();

// --- Popover behavior ---
const popoverContent = document.getElementById('popoverContent');
const trigger = document.getElementById('popoverTrigger');
let isOpen = false;

function openPopover() {
  isOpen = true;
  popoverContent.classList.add('open');
  trigger.classList.add('active');
}

function closePopover() {
  isOpen = false;
  popoverContent.classList.remove('open');
  trigger.classList.remove('active');
}

trigger.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isOpen) closePopover();
  else openPopover();
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!isOpen) return;
  const shell = document.getElementById('appShell');
  if (!shell) return;
  // Close if click is outside the trigger AND outside the popover content
  if (!trigger.contains(e.target) && !popoverContent.contains(e.target)) {
    closePopover();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) closePopover();
});
</script>

</body>
</html>
