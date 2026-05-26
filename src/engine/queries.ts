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
  const containsRels = state.relations
    .filter((r) => r.source === containerId && r.type === "contains")
    .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));

  const children = containsRels
    .map((r) => getEntity(state, r.target))
    .filter((e): e is Entity => e !== undefined);

  if (depth <= 0) return children;

  const flattened: Entity[] = [];
  for (const child of children) {
    if (child.type === "container" && depth > 0) {
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

export function getRootContainers(state: GraphState): Entity[] {
  const childIds = new Set(
    state.relations
      .filter((r) => r.type === "contains")
      .map((r) => r.target),
  );
  return state.entities.filter(
    (e) => e.type === "container" && !childIds.has(e.id),
  );
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

export function getRelationTypes(state: GraphState): string[] {
  return [...new Set(state.relations.map((r) => r.type))].sort()
}

export function getNestingDepth(entities: Entity[], entityId: string): number {
  let depth = 0
  let current = entityId
  for (let i = 0; i < 20; i++) {
    const entity = entities.find((e) => e.id === current)
    if (!entity?.parentId) break
    depth++
    current = entity.parentId
  }
  return depth
}

export function wouldCreateCycle(entities: Entity[], childId: string, newParentId: string): boolean {
  if (childId === newParentId) return true
  let current: string | undefined = newParentId
  const visited = new Set<string>()
  while (current) {
    if (current === childId) return true
    visited.add(current)
    const entity = entities.find((e) => e.id === current)
    current = entity?.parentId
  }
  return false
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
    crumbs.unshift({ id: current, title: entity.content || current });
    const parentRel = state.relations.find(
      (r) => r.target === current && r.type === "contains",
    );
    if (!parentRel) break;
    current = parentRel.source;
  }

  return crumbs;
}
