> **Deprecation note (2026-05-15):** This document's active work was moved to PRD0010-1 (in archive) and implemented. The three postponed items are all deprecated by the subsequent architectural shift to TipTap containers with separate content storage (PRD0018):
> 1. `metadata.type` rendering — moot since rendering is driven by ProseMirror document structure, not entity metadata.
> 2. Hamlet ID migration — hamlet data is bundled legacy content, not active data. Migrating its segment IDs adds no value.
> 3. Container content children naming — `_content` segments were a hamlet-era convention, irrelevant since content separation.
>
> The core ID scheme (slugify, generateEntityId, zero-padding, collision handling) shipped in PRD0010-1 and remains in use. These postponed items will not be implemented.

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 780px; margin: 40px auto; padding: 0 24px; color: #1a1a2e; line-height: 1.6; }
  h1 { font-size: 1.6rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
  h2 { font-size: 1.2rem; margin-top: 32px; color: #333; }
  .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
  .note strong { color: #856404; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.85rem; }
  th, td { text-align: left; padding: 6px 10px; border: 1px solid #ddd; }
  th { background: #f5f5f5; font-weight: 600; }
  code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 0.85rem; }
</style>
</head>
<body>

<h1>PRD0010 — Entity Model (Postponed Items)</h1>

<div class="note">
<strong>Active implementation moved to PRD0010-1.</strong>
This document retains the postponed items not yet implemented.
See <code>dev-docs/plans/prd0010-1-minimal-entity-model.md</code> for current sprint work.
</div>

<h2>Postponed</h2>

<ul>
  <li><strong>Rule 5: <code>metadata.type</code> drives rendering</strong> — The renderer determines display from <code>metadata.type</code>, not <code>kind</code> or <code>title</code>. <code>kind</code> (<code>container</code> vs <code>segment</code>) is a structural concern only. This will be evaluated and implemented alongside TipTap integration.</li>
  <li><strong>Hamlet data migration</strong> — Renaming hello2/graph.json entities to the new ID scheme (<code>seg_18</code> → <code>hamlet_act-01_scene-01_seg-0001</code>). The old IDs persist for now.</li>
  <li><strong>Container content children naming</strong> — Renaming <code>_content</code> child segments to use <code>seg-0001</code> format.</li>
</ul>

<h2>Reference: Full scheme design</h2>

<p>The complete ID scheme design (slug rules, counter scheme, zero-padding rationale, edge cases) is documented in <code>dev-docs/plans/prd0010-1-minimal-entity-model.md</code> which was derived from this document. The scheme itself is implemented; only the above items are postponed.</p>

</body>
</html>
