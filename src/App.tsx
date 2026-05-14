import { useMemo } from "react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "./store/useGraphStore";
import type { Entity, Relation } from "./types/graph";

function assignLayout(
  entities: Entity[],
  relations: Relation[],
): { x: number; y: number }[] {
  const children = new Map<string, string[]>();
  const parentOf = new Map<string, string>();

  for (const r of relations) {
    if (r.type === "contains") {
      const kids = children.get(r.source) ?? [];
      kids.push(r.target);
      children.set(r.source, kids);
      parentOf.set(r.target, r.source);
    }
  }

  const ordered = new Map<string, { x: number; y: number }>();
  let y = 0;

  for (const entity of entities) {
    if (parentOf.has(entity.id)) continue;
    ordered.set(entity.id, { x: 0, y });
    y += 150;
    const kids = children.get(entity.id);
    if (kids) {
      let cx = -100;
      for (const kid of kids) {
        ordered.set(kid, { x: cx, y });
        cx += 200;
      }
      y += 150;
    }
  }

  return entities.map((e) => ordered.get(e.id) ?? { x: 0, y: 0 });
}

function toReactFlowNodes(entities: Entity[], positions: { x: number; y: number }[]) {
  return entities.map((entity, i) => ({
    id: entity.id,
    type: "default",
    position: positions[i],
    data: {
      label: entity.title ?? entity.id,
      kind: entity.kind,
    },
  }));
}

function toReactFlowEdges(relations: Relation[]) {
  return relations.map((r) => ({
    id: r.id,
    source: r.source,
    target: r.target,
    label: r.type,
    style:
      r.type === "annotates" ? { strokeDasharray: "4 4" } : undefined,
  }));
}

function App() {
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);

  const { nodes, edges } = useMemo(() => {
    const positions = assignLayout(entities, relations);
    return {
      nodes: toReactFlowNodes(entities, positions),
      edges: toReactFlowEdges(relations),
    };
  }, [entities, relations]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}

export default App;
