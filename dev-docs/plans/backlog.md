

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

---



