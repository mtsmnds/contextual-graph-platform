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

type CanvasState = {
  positions: Record<string, { x: number; y: number }>;
  dimensions: Record<string, { width: number; height: number }>;
  viewport?: { x: number; y: number; zoom: number };
};

type GraphSnapshot = {
  version: 4;
  entities: Entity[];
  relations: Relation[];
  canvas: CanvasState;
};

export type {
  EntityKind,
  Entity,
  Relation,
  ViewState,
  GraphSnapshot,
  CanvasState,
};
