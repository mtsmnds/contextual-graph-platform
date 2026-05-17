type EntityKind =
  | "segment"
  | "container"
  | "annotation"
  | "concept"
  | "summary";

type Entity = {
  id: string;
  kind: EntityKind;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

type Relation = {
  id: string;
  source: string;
  target: string;
  type: string;
  sortOrder: string;
  metadata: Record<string, unknown>;
};

type ViewState = {
  focusedEntityId: string | null;
  anchorEntityId: string | null;
  visibleEntityIds: string[];
  expandedPanels: string[];
};

type GraphSnapshot = {
  version: 3;
  entities: Entity[];
  relations: Relation[];
};

export type {
  EntityKind,
  Entity,
  Relation,
  ViewState,
  GraphSnapshot,
};
