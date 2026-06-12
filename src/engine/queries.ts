import type { Entity, Relation } from "../types/graph";

export function compareSortOrder(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

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
    .sort((a, b) => compareSortOrder(a.sortOrder, b.sortOrder));

  const children = containsRels
    .map((r) => getEntity(state, r.target))
    .filter((e): e is Entity => e !== undefined);

  if (depth <= 0) return children;

  const flattened: Entity[] = [];
  for (const child of children) {
    if (hasChildren(state, child.id) && depth > 0) {
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

export function getNestingDepth(state: { relations: Relation[] }, entityId: string): number {
  let depth = 0
  let current = entityId
  for (let i = 0; i < 20; i++) {
    const parentRel = state.relations.find(
      (r) => r.target === current && r.type === "contains",
    )
    if (!parentRel) break
    depth++
    current = parentRel.source
  }
  return depth
}

export function wouldCreateCycle(state: { relations: Relation[] }, childId: string, newParentId: string): boolean {
  if (childId === newParentId) return true
  let current: string | undefined = newParentId
  const visited = new Set<string>()
  while (current) {
    if (current === childId) return true
    if (visited.has(current)) return true
    visited.add(current)
    const parentRel = state.relations.find(
      (r) => r.target === current && r.type === "contains",
    )
    current = parentRel?.source
  }
  return false
}

export function getParentId(state: { relations: Relation[] }, entityId: string): string | undefined {
  return state.relations.find(
    (r) => r.target === entityId && r.type === "contains",
  )?.source
}

export function getChildIds(state: { relations: Relation[] }, parentId: string): string[] {
  return state.relations
    .filter((r) => r.source === parentId && r.type === "contains")
    .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder))
    .map((r) => r.target)
}

export function hasChildren(state: { relations: Relation[] }, entityId: string): boolean {
  return state.relations.some((r) => r.source === entityId && r.type === "contains")
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

export function getCollapsedDescendants(
  collapsedIds: string[],
  relations: Relation[],
): Set<string> {
  const hidden = new Set<string>()
  function collect(containerId: string) {
    for (const rel of relations) {
      if (rel.source === containerId && rel.type === "contains") {
        hidden.add(rel.target)
        collect(rel.target)
      }
    }
  }
  for (const id of collapsedIds) {
    collect(id)
  }
  return hidden
}
