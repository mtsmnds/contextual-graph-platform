import type { Entity, Relation } from "../types/graph";

interface GraphState {
  entities: Entity[];
  relations: Relation[];
}

export function getEntity(state: GraphState, id: string): Entity | undefined {
  return state.entities.find((e) => e.id === id);
}

export function getRelations(
  state: GraphState,
  entityId: string,
): Relation[] {
  return state.relations.filter(
    (r) => r.source === entityId || r.target === entityId,
  );
}

export function getSequentialContext(
  state: GraphState,
  entityId: string,
): { prev?: Entity; next?: Entity } | null {
  const entity = getEntity(state, entityId);
  if (!entity) return null;

  const nextRel = state.relations.find(
    (r) => r.source === entityId && r.type === "next",
  );
  const prevRel = state.relations.find(
    (r) => r.target === entityId && r.type === "next",
  );

  return {
    prev: prevRel ? getEntity(state, prevRel.source) : undefined,
    next: nextRel ? getEntity(state, nextRel.target) : undefined,
  };
}

export function getLinkedContext(
  state: GraphState,
  entityId: string,
): { entity: Entity; relation: Relation }[] {
  const relations = state.relations.filter(
    (r) => r.source === entityId || r.target === entityId,
  );

  return relations
    .map((r) => {
      const linkedId = r.source === entityId ? r.target : r.source;
      const entity = getEntity(state, linkedId);
      return entity ? { entity, relation: r } : null;
    })
    .filter((x): x is { entity: Entity; relation: Relation } => x !== null);
}

export function getContainerChildren(
  state: GraphState,
  containerId: string,
  depth = Infinity,
): Entity[] {
  const childIds = state.relations
    .filter((r) => r.source === containerId && r.type === "contains")
    .map((r) => r.target);

  const children = childIds
    .map((id) => getEntity(state, id))
    .filter((e): e is Entity => e !== undefined);

  if (childIds.length === 0) return children;

  const childSet = new Set(childIds);
  const nextMap = new Map<string, string>();
  for (const r of state.relations) {
    if (r.type === "next" && childSet.has(r.source) && childSet.has(r.target)) {
      nextMap.set(r.source, r.target);
    }
  }

  // Find the head of the chain (entity that no other child points to via next)
  const targets = new Set(nextMap.values());
  const head = childIds.find((id) => !targets.has(id)) ?? childIds[0];

  const ordered: Entity[] = [];
  let current = head;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const entity = getEntity(state, current);
    if (entity) ordered.push(entity);
    current = nextMap.get(current) ?? "";
  }

  // Append any remaining children not in the chain
  for (const child of children) {
    if (!seen.has(child.id)) ordered.push(child);
  }

  // Flatten recursively: sub-containers expand to their content, segments stay
  if (depth <= 0) return ordered;

  const flattened: Entity[] = [];
  for (const child of ordered) {
    if (child.kind === "container" && depth > 0) {
      flattened.push(child);
      flattened.push(
        ...getContainerChildren(state, child.id, depth - 1),
      );
    } else {
      flattened.push(child);
    }
  }
  return flattened;
}

export function resolveContainer(
  state: GraphState,
  entityId: string,
): string {
  const parentRel = state.relations.find(
    (r) => r.target === entityId && r.type === "contains",
  );
  if (!parentRel) return entityId;
  return resolveContainer(state, parentRel.source);
}

export function getContainerBreadcrumb(
  state: GraphState,
  containerId: string,
): { id: string; title: string }[] {
  const crumbs: { id: string; title: string }[] = [];
  let current = containerId;

  for (let i = 0; i < 10; i++) {
    const entity = getEntity(state, current);
    if (!entity) break;
    crumbs.unshift({ id: current, title: entity.title ?? current });
    const parentRel = state.relations.find(
      (r) => r.target === current && r.type === "contains",
    );
    if (!parentRel) break;
    current = parentRel.source;
  }

  return crumbs;
}
