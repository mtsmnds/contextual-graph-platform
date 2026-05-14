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
