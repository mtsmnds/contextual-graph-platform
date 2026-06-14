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
  collapsedContainers: string[];
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

/** Entry point for a multi-file graph. Maps collection IDs to their sub-file paths. */
type Manifest = {
  version: 1
  main: string
  collections: Record<string, ManifestCollection>
}

/** Describes a single book collection's file layout within a multi-file graph folder. */
type ManifestCollection = {
  type: "book"
  content: Record<string, string>
  chapters: Record<string, string>
  notes: string
}

/** Tracks which entities and relations came from which sub-file path. */
type LoadedCollection = {
  entityIds: Set<string>
  relationIds: Set<string>
  entityFile: Record<string, string>
  relationFile: Record<string, string>
}

/** View/workspace data stored separately from domain data (graph.json). */
type WorkspaceData = {
  version: 1
  canvasPositions: Record<string, CanvasData>
  viewport?: { x: number; y: number; zoom: number }
  collapsedContainers: string[]
}

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
  Manifest,
  ManifestCollection,
  LoadedCollection,
  WorkspaceData,
};
