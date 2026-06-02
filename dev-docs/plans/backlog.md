

## current challenge: 
- adding data gradually and verifying and building the shape of the data for the graph. 

- we have ways to visualize the data but now we need more reliable v1 ways of adding data to the graph. 
  
- because we are moving towards more than one route paths we need more robust components to be applied across those paths, including crud, sidebar, file system access.
  - some of those are a matter of implementing others need rework
  - for reliable creation of entities and relations we need to implement fractional indexing

- for now the react-flow canvas relies in parentId key, but i don't like it. the truth is in edge relations and this is a duplication of the data in the object. id rather we use only the truth (the edges) in the graph and don't write the parentId to the graph. if react-flow needs it we can have it exist in a layer that the canvas uses, but not written back to local storage. 

- we need to see "rich text" but we don't need to overcomplicate it so we are going with remark as the choice. content is written in markdown, displayed via remark

- start using dagre seriously now in the canvas to organize the data


## to do


Suggested sequencing for the newer items:

1. Improve FS → enables VizTest1 hydration, unblocks shared chrome

2. Shared sidebar/inspector → unify the chrome, both routes use the same components

3. Filter by selection → first query feature, immediately useful

4. Tier 2 CRUD (contextual buttons on nodes) → builds on the form sections you already have

5. Book view / threaded container view → the i2 roadmap payoff

6. Collapse with propagation → needs design first

7. Workspace panels → architectural shift, do it when the pieces are ready

The earlier items (edit mode, deprecate parentId, remark, dagre) can interleave with this — they’re independent tracks.

pending 

pending: 
- improve fs file system
- make the entity form edit mode. 
- deprecate parentId
- add remark for rich text
- configure dagre in canvas to optimize node position and size, as well as edge handles



## chat


Prompt

- unify interface between viz-test and canvas (?) could unify, use the same sidebar, node inspector, json inspector. 

- improve crud experience: in three parts: 1 crud experience in the sidebar/dialog: could be more general because it sees/shows the graph data on its own way. 2. the crud opportunities specific to canvas and viz like having buttons show in the interface as a node is selected or hovered to open close settings like reorder, edit, add in between, add after, add before, etc. 3. for canvas forgo completely the need for a sidebar by showing all the data about the node contextually next to it/in its card. (this one probably farthest away from current development)

- query/filter/collapse - features that would improve how the user sees the whole data by selecting only a portion of the nodes to see
  - filter 1: select a node to see only what is related to it. 
  - the "book" or note taking view: similar to filter 1, would show all the nodes contained by a parent node, in reading order, maybe added to a `x hops from` filter that would how relations x hops away too (this would show for example connections to segments that come or go to other books as well)
  - for any filter we need a feature where (at least in canvas, or when seeing the nodes as cards) we can click a button to show the relations of this node.
  - select more than one node: a good `query` for editing of researching with two main documents, where you are reading side by side and creating notes to and fro two collections of nodes
  - collapse and propagating: - this is really important. if for example we want to see only books and their relations, we could choose to not see the internal containers (for example the `content` `synopsis` `notes` etc and all within like `act` and `scene` and segments, but the relations to the outside would propagate back to the book, showing how it relates to other nodes via their child relations. 
  - and many more possibilities with traversal and propagation
 
- change how canvas/viz-test are "loaded" - instead of each opening in a route, we could have the user pick what they want to see in workspace root, so they could see canvas and viz side by side if they want and new visualizations or options could all load in parallel - what you think?


Answer

This is a solid roadmap. Let me react to the newer items since we’ve covered the first batch already.

Unify interface between viz-test and canvas — this makes sense and is naturally tied to the FS improvement. Once both routes hydrate from the same store, sharing sidebar/inspector/JSON view becomes straightforward. The entity form you just built is already the first piece of this — it works in either route. I’d frame this less as “unify” and more as “shared chrome” — a sidebar shell and inspector that both routes mount into, while the main viewport stays route-specific (canvas vs. d3).

CRUD experience in three tiers — the framing is right, and the order is right. Tier 1 (sidebar/dialog) is what you just built and will keep improving. Tier 2 (contextual buttons on hover/select) is the natural next layer — it’s where sort order really shines because you can offer “insert before / after / between” right on the node. Tier 3 (fully contextual canvas cards with no sidebar) is the furthest out but also the most differentiated thing about your tool. Keep it on the horizon, don’t rush it.

Query/filter/collapse — this is the most exciting part of the list and probably the hardest. A few thoughts:

- Filter by selection (show only what’s related to node X) is the entry point. It’s the simplest to implement and immediately useful. Start here.

- The “book view” (contained children in reading order + N hops) is where sort order and the graph model really pay off. This is essentially the “Threaded Container View” from your i2 roadmap — the feature that sort order was built to enable.

- Collapse with propagation is the deep one. Collapsing containers and bubbling their external relations up to the parent is a graph traversal problem — doable, but it needs careful thought about what “propagate” means for different relation types. Worth a dedicated design conversation before PRD-ing.

- Multi-select for side-by-side research — interesting UX. This is more of a viewport/workspace feature than a graph query feature. It ties into your last point about loading multiple views.

Workspace root as a layout host — yes, this is the right direction. Instead of routes being full-page takeovers, WorkspaceRoot becomes a shell where you can open canvas, viz, reading view, etc. in panels. This is a significant architecture shift though — it changes routing, state management, and layout. I’d keep it on the list but not tackle it until the shared chrome (unified sidebar/inspector) is solid, because that’s the prerequisite. Panels without shared UI components would just be two disconnected apps side by side.




creating entity form in viz-test-1
then 
      - create entity form in update mode
      - add to canvas

- - -

recent snapshots
- clickable
- persist after reload


node metadata panel
- show all properties from the node
- id should be editable. id edit process re-dos the edges
- shows all properties, really. position properties are view only (x/y/width/height)
- supposed to look like the example with key and values in same row. get example to show


question, plan mode:
 - i thought the current states in "recent snapshots" would be clickable like manual saves.
 - i didn't understand what the "You have unsaved snapshots from your last session." means. 


fix
- when i reload no snapshots appear in the list, but i thought it would show up to ten. 

three dots should be the solid one not the lines one

- - - - - 

i don't think prds are detailed enough. we need to detail the plan for the interface, each button, action or behavior that needs ui/ux. we need to detail what pattern (shadcn, what) are we using or where to research. worst case we point that the ui/ux for the feature already exists and say what it is. 

also should also have a section for edge cases

- - - -


* improvement - node metadata opens as apendix when you select any node? - or when you start editing node content. i think it could be nice in a flow where you are editing content and might needo to edit the metadata

* check what happens with the seed data when the user opens a folder for the first time or recuring. when the user opens a folder we should unload the seed and then load the user's data. we should only write sample nodes if the folder opened is super empty.






## Deferred from i1

Items removed from i1 scope during implementation. Some are now in i2; others remain for future consideration.

### Cleanup polish

- Fine-tune text size, handle size, and border activation area after zoom buttons and 100% view
- Handle border thickness change with interaction — different shades (borders go very dark)
- Prepare approach for nodes having different appearances depending on entity kind

### Floating edges

From the original container grouping design. Container grouping itself moved to i2 (§4, `m5-prd0045`), but the floating-edge routing concept was not carried over.

Custom edge component that routes to the nearest point on the target node's perimeter (top/right/bottom/left depending on relative position), instead of connecting to fixed handle positions. Uses `getBezierPath` or `getSmoothStepPath` with computed source/target positions. Registered as an `Edge` type at module scope alongside `nodeTypes`.

### Future ideas (not in i2)

- Book metadata, annotations, and content — import/management UI within the graph
- Container-labeled group node refinement (SubFlows pattern for complex hierarchies)
- Bulk input interface that transforms structured info into graph data
- Easy connect — floating handle when dragging from a node for intuitive edge creation (may compete with node dragging)
- Smart drag-out-to-detach — dragging a child node out of its parent container automatically detaches it (removes `parentId`, converts position to absolute). Current approach uses context menu "Detach from Group" instead.

---



