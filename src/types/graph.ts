type EntityKind =
  | "segment"
  | "container"
  | "annotation"
  | "concept"
  | "summary";

type Entity = {
  id: string;
  kind: EntityKind;
  title?: string;
  content?: string;
  metadata: Record<string, unknown>;
};

type RelationType =
  | "contains"
  | "next"
  | "references"
  | "annotates"
  | "summarizes"
  | "related_to";

type Relation = {
  id: string;
  source: string;
  target: string;
  type: RelationType;
  metadata: Record<string, unknown>;
};

type ViewState = {
  focusedEntityId: string | null;
  anchorEntityId: string | null;
  visibleEntityIds: string[];
  expandedPanels: string[];
};

type GraphSnapshot = {
  version: number;
  entities: Entity[];
  relations: Relation[];
};

export type {
  EntityKind,
  Entity,
  RelationType,
  Relation,
  ViewState,
  GraphSnapshot,
};
