
1

Story 1.1: Container Representation in Graph
- As a system architect,
- I want containers to be represented as standard nodes with explicit edge relationships pointing to their children,
- So that we can manipulate or render container relationships using standard graph layout algorithms in other views.

- Acceptance Criteria:
  - Container nodes possess unique database identifiers.
  - Child nodes retain independent property objects.
  - Structural hierarchy is maintained via an edge with the type parameter type: "container-child".

- Questions: 
  - what edge type nomenclature to use? i prefer shorter, and i think our edges are directional so we should choose, i'm happy with "container" or "child" or "parent"
  - should we make this relation as a property or as an edge? are we creating a lot of more work if we go against the grain and create them as edges?


Story 1.2: Canvas Direct Node Creation
- As a researcher,
- I want to double-click inside an existing container to instantly generate a new node inside it,
- So that I don't have to manually link new data points to my current grouping.

- Acceptance Criteria:
  - System captures screen coordinates from the double-click event.
  - System checks if coordinates sit within a React Flow container boundary.
  - New node automatically spawns with the parent edge relation pre-configured, and position relative to container.

Story 1.3: Drag-and-Drop Container Assignment
- As a researcher,
- I want to drag an existing unassigned node directly into a container's visual area,
- So that I can intuitively group existing information.
  
- Acceptance Criteria:
  - Dropping a node inside a container trigger-updates the back-end graph database.
  - System dynamically generates the edge.
  - Visual wrapper context updates immediately without screen stuttering.

Story 1.4: Relative Position Retention
- As a researcher,
- I want that when I move a container in the canvas, the position of the child nodes remain the same relative to the container
- So that my custom spatial arrangements are preserved.
  
2

Story 2.1: Boundary-Agnostic Edge Connections
- As a researcher,
- I want to draw connection edges from node handles inside a container to target handles located outside that container,
- So that structural containment does not limit associative data links.

- Acceptance Criteria:
  - Interaction handles remain fully operational within nested React Flow views.
  - Edges can cross group boundaries seamlessly without triggering layout calculation errors.