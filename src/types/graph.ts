type EntityType =
  | "segment"
  | "container"
  | "annotation"
  | "concept"
  | "summary";

type CanvasData = {
  x: number
  y: number
  width: number
  height: number
}

type Entity = {
  id: string;
  type: EntityType;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  canvasData: CanvasData;
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
  viewport?: { x: number; y: number; zoom: number };
};

type GraphSnapshot = {
  version: 5;
  entities: Entity[];
  relations: Relation[];
  canvas: CanvasState;
};

type HistoryEntry = {
  entities: Entity[];
  relations: Relation[];
  canvas: CanvasState;
  description: string;
  timestamp: number;
  version: number;
};

type AutoBackupEntry = HistoryEntry & {
  documents: Record<string, Record<string, unknown>>;
};

export type {
  EntityType,
  CanvasData,
  Entity,
  Relation,
  ViewState,
  GraphSnapshot,
  CanvasState,
  HistoryEntry,
  AutoBackupEntry,
};
