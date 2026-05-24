import { create } from "zustand";
import { generateKeyBetween } from "fractional-indexing";
import type { Entity, EntityType, Relation, ViewState, GraphSnapshot, CanvasState, CanvasData, HistoryEntry, AutoBackupEntry } from "../types/graph";
import { generateUniqueId, slugify } from "../engine/ids";
import { SEED_DATA, SEED_CONTAINER_CONTENT } from "../data/seed";
import { persistAutoSnapshots } from "../engine/backup";
import type { PersistenceAdapter } from "./persistence";

let _adapter: PersistenceAdapter | null = null;
let _hydrated = false;

const contentCache: Record<string, Record<string, unknown>> = {};

export function migrateSnapshot(snapshot: {
  version: number;
  entities: Record<string, unknown>[];
  relations: Record<string, unknown>[];
  canvas?: Record<string, unknown>;
}): GraphSnapshot {
  let entities = snapshot.entities
  let relations = snapshot.relations
  let canvas: Record<string, unknown> = snapshot.canvas ?? {}
  let version = snapshot.version as number

  if (version < 2) {
    const now = Date.now()
    entities = entities.map((e) => ({
      ...e,
      createdAt: e.createdAt ?? now,
      updatedAt: e.updatedAt ?? now,
    }))
    relations = relations.map((r) => ({
      ...r,
      sortOrder: r.sortOrder ?? generateKeyBetween(null, null),
    }))
    version = 2
  }

  if (version < 3) {
    entities = entities.map((e) => {
      const oldTitle = e.title as string | undefined
      const oldContent = e.content as string | undefined

      if (oldTitle && oldContent) {
        return {
          ...e,
          content: oldContent,
          metadata: { ...(e.metadata as Record<string, unknown> ?? {}), title: oldTitle },
        }
      }
      return {
        ...e,
        content: oldContent || oldTitle || "",
      }
    })
    version = 3
  }

  if (version < 4) {
    canvas = { positions: {}, dimensions: {} }
    version = 4
  }

  if (!canvas.dimensions) {
    canvas = { ...canvas, dimensions: {} }
  }

  if (version < 5) {
    const positions = (canvas.positions as Record<string, { x: number; y: number }>) ?? {}
    const dimensions = (canvas.dimensions as Record<string, { width: number; height: number }>) ?? {}
    entities = entities.map((e) => {
      const id = e.id as string
      const pos = positions[id]
      const dim = dimensions[id]
      return {
        ...e,
        canvasData: {
          x: pos?.x ?? 0,
          y: pos?.y ?? 0,
          ...(dim ? { width: dim.width, height: dim.height } : {}),
        },
      }
    })
    canvas = { viewport: canvas.viewport }
    version = 5
  }

  // v5 data may still have "kind" from pre-rename. Normalize to "type".
  entities = entities.map((e) => {
    if ("kind" in e && !("type" in e)) {
      const { kind, ...rest } = e
      return { ...rest, type: kind }
    }
    return e
  })

  return {
    version: version as 5,
    entities: entities as unknown as Entity[],
    relations: relations as unknown as Relation[],
    canvas: canvas as unknown as CanvasState,
  }
}

interface GraphStore {
  entities: Entity[];
  relations: Relation[];
  canvas: CanvasState;
  view: ViewState;
  contentLoaded: Record<string, boolean>;
  adapterId: string | null;
  folderName: string | null;
  hydrated: boolean;

  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  batchDepth: number;
  batchDescription: string;
  _pendingSnapshot: HistoryEntry | null;
  lastMutationTime: number;

  init: (adapter: PersistenceAdapter) => Promise<void>;
  beginBatch: (description: string) => void;
  endBatch: () => void;
  undo: () => void;
  redo: () => void;
  getAdapterHandle: () => FileSystemDirectoryHandle | null;

  addEntity: (type: EntityType, data?: { content?: string; metadata?: Record<string, unknown>; canvasData?: CanvasData }, parentId?: string | null) => string;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelation: (source: string, target: string, type: string, metadata?: Record<string, unknown>, sortOrder?: string) => string;
  updateRelation: (id: string, patch: Partial<Relation>) => void;
  removeRelation: (id: string) => void;
  getEdgesForNode: (id: string, direction?: "in" | "out" | "both") => Relation[];
  queryThread: (filter: { target: string; relationType: string }) => Entity[];

  focusEntity: (id: string | null, anchorId?: string | null) => void;
  expandPanel: (entityId: string) => void;
  closePanel: (entityId: string) => void;

  getContent: (id: string) => Record<string, unknown> | null;
  loadContentDirect: (documents: Record<string, Record<string, unknown>>) => void;
  saveContent: (id: string, data: Record<string, unknown>) => void;
  clearContent: (id: string) => void;
  refreshFolderName: () => void;

  applyMeasuredDimensions: (dimensions: Record<string, CanvasData>) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}

const storeInitializer = (set: any, get: any): GraphStore => ({
  entities: [],
  relations: [],
  canvas: {},
  view: {
    focusedEntityId: null,
    anchorEntityId: null,
    visibleEntityIds: [],
    expandedPanels: [],
  },
  contentLoaded: {},
  adapterId: null,
  folderName: null,
  hydrated: false,

  undoStack: [],
  redoStack: [],
  batchDepth: 0,
  batchDescription: "",
  _pendingSnapshot: null,
  lastMutationTime: 0,

  init: async (adapter: PersistenceAdapter) => {
    _adapter = adapter;

    const workspace = await adapter.loadWorkspace();

    if (workspace) {
      const migrated = migrateSnapshot(workspace);
      const containerEntities = migrated.entities.filter((e) => e.type === "container");
      for (const entity of containerEntities) {
        const doc = await adapter.loadDocument(entity.id).catch(() => null);
        if (doc) contentCache[entity.id] = doc;
      }

      const currentEntities: Entity[] = get().entities;
      const existingIds: Set<string> = new Set(currentEntities.map((e) => e.id));
      const idMap = new Map<string, string>();

      const remappedEntities = migrated.entities.map((e) => {
        const isSeedCollision = SEED_DATA.entities.some((s) => s.id === e.id) && existingIds.has(e.id);
        if (!isSeedCollision) return e;
        const currentEntity = currentEntities.find((ce) => ce.id === e.id);
        const suffix = slugify(e.content || e.type);
        let newId = `${Date.now()}-${suffix}`;
        let counter = 1;
        while (existingIds.has(newId)) {
          newId = `${Date.now()}-${suffix}-${counter++}`;
        }
        existingIds.add(newId);
        idMap.set(e.id, newId);
        return { ...e, id: newId, updatedAt: Date.now(), canvasData: currentEntity?.canvasData ?? e.canvasData };
      });

      for (const [oldId, newId] of idMap) {
        const doc = contentCache[oldId] ?? await adapter.loadDocument(oldId).catch(() => null);
        if (doc) {
          contentCache[newId] = doc;
          delete contentCache[oldId];
          adapter.saveDocument(newId, doc).catch(() => {});
          adapter.deleteDocument(oldId).catch(() => {});
        }
      }

      const relations = migrated.relations.map((r) => ({
        ...r,
        source: idMap.get(r.source) ?? r.source,
        target: idMap.get(r.target) ?? r.target,
      }));

      set({
        entities: remappedEntities,
        relations,
        canvas: migrated.canvas,
        contentLoaded: Object.fromEntries(remappedEntities.filter((e) => e.type === "container").map((e) => [e.id, true])),
        adapterId: adapter.id,
        folderName: adapter.getFolderName(),
        undoStack: [],
        redoStack: [],
        batchDepth: 0,
      });

      if (idMap.size > 0) {
        adapter.saveGraph({ version: 5, entities: remappedEntities, relations, canvas: migrated.canvas }).catch(() => {});
      }
    } else {
      const existingIds = new Set<string>()
      const idMap = new Map<string, string>()
      const now = Date.now()

      const seedEntities = SEED_DATA.entities.map((e) => {
        const suffix = e.content ? slugify(e.content) : e.type
        let id = `${now}-${suffix}`
        let counter = 1
        while (existingIds.has(id)) {
          id = `${now}-${suffix}-${counter++}`
        }
        existingIds.add(id)
        idMap.set(e.id, id)
        return { ...e, id, createdAt: now, updatedAt: now }
      })

      const containerEntities = seedEntities.filter((e) => e.type === "container")

      for (const entity of SEED_DATA.entities.filter((e) => e.type === "container")) {
        const newId = idMap.get(entity.id)
        if (!newId) continue
        const doc = SEED_CONTAINER_CONTENT[entity.id]
        if (doc) {
          contentCache[newId] = doc
          adapter.saveDocument(newId, doc).catch(() => {})
        }
      }

      const seedSnapshot: GraphSnapshot = {
        version: 5,
        entities: seedEntities,
        relations: SEED_DATA.relations,
        canvas: {},
      };
      adapter.saveGraph(seedSnapshot).catch(() => {});

      set({
        entities: seedEntities,
        relations: SEED_DATA.relations,
        canvas: {},
        contentLoaded: Object.fromEntries(containerEntities.map((e) => [e.id, true])),
        adapterId: adapter.id,
        folderName: adapter.getFolderName(),
        undoStack: [],
        redoStack: [],
        batchDepth: 0,
      });
    }

    _hydrated = true;
    set({ hydrated: true });
  },

  beginBatch: (description: string) => {
    const state = get() as GraphStore;
    const depth = state.batchDepth;
    if (depth === 0) {
      const snapshot: HistoryEntry = {
        entities: state.entities,
        relations: state.relations,
        canvas: state.canvas,
        description,
        timestamp: Date.now(),
        version: 5,
      };
      set({ _pendingSnapshot: snapshot, batchDepth: 1, lastMutationTime: Date.now() });
    } else {
      set({ batchDepth: depth + 1, lastMutationTime: Date.now() });
    }
  },

  endBatch: () => {
    const state = get() as GraphStore;
    const depth = state.batchDepth;
    if (depth <= 0) return;

    if (depth === 1) {
      const snapshot = state._pendingSnapshot;
      if (snapshot) {
        set({
          undoStack: [...state.undoStack.slice(-49), snapshot].length > 50
            ? [...state.undoStack.slice(-49), snapshot]
            : [...state.undoStack, snapshot],
          redoStack: [],
          batchDepth: 0,
          _pendingSnapshot: null,
        });
      } else {
        set({ batchDepth: 0, redoStack: [] });
      }
    } else {
      set({ batchDepth: depth - 1 });
    }
  },

  undo: () => {
    const state = get() as GraphStore;
    if (state.undoStack.length === 0) return;

    const newUndo = [...state.undoStack];
    const entry = newUndo.pop()!;

    const currentSnapshot: HistoryEntry = {
      entities: state.entities,
      relations: state.relations,
      canvas: state.canvas,
      description: "Current state",
      timestamp: Date.now(),
      version: 5,
    };

    set({
      entities: entry.entities,
      relations: entry.relations,
      canvas: entry.canvas,
      undoStack: newUndo,
      redoStack: [...state.redoStack, currentSnapshot],
    });
  },

  redo: () => {
    const state = get() as GraphStore;
    if (state.redoStack.length === 0) return;

    const newRedo = [...state.redoStack];
    const entry = newRedo.pop()!;

    const currentSnapshot: HistoryEntry = {
      entities: state.entities,
      relations: state.relations,
      canvas: state.canvas,
      description: "Current state",
      timestamp: Date.now(),
      version: 5,
    };

    set({
      entities: entry.entities,
      relations: entry.relations,
      canvas: entry.canvas,
      undoStack: [...state.undoStack, currentSnapshot],
      redoStack: newRedo,
    });
  },

  getAdapterHandle: () => {
    return _adapter?.getRootHandle?.() ?? null;
  },

  addEntity: (type: EntityType, data?: { content?: string; metadata?: Record<string, unknown>; canvasData?: CanvasData }, parentId: string | null = null) => {
    get().beginBatch("Create node");
    const existingIds: Set<string> = new Set(get().entities.map((e: Entity) => e.id));
    const siblingCount = parentId
      ? get().entities.filter((e: Entity) => e.id.startsWith(`${parentId}_seg-`)).length
      : 0;
    const content = data?.content ?? ""
    const id = generateUniqueId(parentId, type, content || type, existingIds, siblingCount);
    const now = Date.now();
    const entity: Entity = {
      id,
      type,
      content,
      metadata: data?.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      canvasData: data?.canvasData ?? { x: 0, y: 0 },
    };
    set((state: GraphStore) => ({ entities: [...state.entities, entity] }));
    get().endBatch();
    return id;
  },

  updateEntity: (id: string, data: Partial<Entity>) => {
    get().beginBatch("Edit node");
    const current = get().entities.find((e: Entity) => e.id === id);
    if (!current) { get().endBatch(); return; }

    let resolvedId = id;
    if (data.id && data.id !== id) {
      const oldId = id;
      resolvedId = data.id;
      set((state: GraphStore) => ({
        relations: state.relations.map((r) => ({
          ...r,
          source: r.source === oldId ? resolvedId : r.source,
          target: r.target === oldId ? resolvedId : r.target,
        })),
      }));
    }

    set((state: GraphStore) => ({
      entities: state.entities.map((e) =>
        e.id === resolvedId
          ? {
              ...e,
              ...data,
              canvasData: data.canvasData ? { ...e.canvasData, ...data.canvasData } : e.canvasData,
              metadata: { ...e.metadata, ...(data.metadata ?? {}) },
              updatedAt: Date.now(),
            }
          : e,
      ),
    }));
    get().endBatch();
  },

  deleteEntity: (id: string) => {
    get().beginBatch("Delete node");
    delete contentCache[id];
    _adapter?.deleteDocument(id).catch(() => {});
    set((state: GraphStore) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relations: state.relations.filter((r) => r.source !== id && r.target !== id),
    }));
    get().endBatch();
  },

  addRelation: (source: string, target: string, type: string, metadata?: Record<string, unknown>, sortOrder?: string) => {
    get().beginBatch("Connect nodes");
    const id = `r_${Date.now()}`;
    const order = sortOrder ?? generateKeyBetween(null, null);
    const relation: Relation = { id, source, target, type, sortOrder: order, metadata: metadata ?? {} };
    set((state: GraphStore) => ({ relations: [...state.relations, relation] }));
    get().endBatch();
    return id;
  },

  removeRelation: (id: string) => {
    get().beginBatch("Delete edge");
    set((state: GraphStore) => ({ relations: state.relations.filter((r) => r.id !== id) }));
    get().endBatch();
  },

  updateRelation: (id: string, patch: Partial<Relation>) => {
    get().beginBatch("Edit edge");
    set((state: GraphStore) => ({
      relations: state.relations.map((r) =>
        r.id === id
          ? { ...r, ...patch, metadata: { ...r.metadata, ...(patch.metadata ?? {}) } }
          : r,
      ),
    }));
    get().endBatch();
  },

  getEdgesForNode: (id: string, direction: "in" | "out" | "both" = "both") => {
    const state = get() as GraphStore;
    return state.relations.filter((r) => {
      if (direction === "in") return r.target === id;
      if (direction === "out") return r.source === id;
      return r.source === id || r.target === id;
    });
  },

  queryThread: (filter: { target: string; relationType: string }) => {
    const state = get() as GraphStore;
    return state.relations
      .filter((r) => r.target === filter.target && r.type === filter.relationType)
      .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder))
      .map((r) => state.entities.find((e) => e.id === r.source))
      .filter((e): e is Entity => e !== undefined);
  },

  focusEntity: (id: string | null, anchorId = null) => {
    set((state: GraphStore) => ({
      view: {
        ...state.view,
        focusedEntityId: id,
        anchorEntityId: anchorId ?? id,
        expandedPanels: [],
      },
    }));
  },

  expandPanel: (entityId: string) => {
    set((state: GraphStore) => ({
      view: {
        ...state.view,
        expandedPanels: state.view.expandedPanels.includes(entityId)
          ? state.view.expandedPanels
          : [...state.view.expandedPanels, entityId],
      },
    }));
  },

  closePanel: (entityId: string) => {
    set((state: GraphStore) => ({
      view: {
        ...state.view,
        expandedPanels: state.view.expandedPanels.filter((id) => id !== entityId),
      },
    }));
  },

  getContent: (id: string) => {
    return contentCache[id] ?? null;
  },

  loadContentDirect: (documents: Record<string, Record<string, unknown>>) => {
    for (const [id, data] of Object.entries(documents)) {
      contentCache[id] = data;
    }
    set((state: GraphStore) => ({
      contentLoaded: { ...state.contentLoaded, ...Object.fromEntries(Object.keys(documents).map((k) => [k, true])) },
    }));
  },

  applyMeasuredDimensions: (dimensions: Record<string, CanvasData>) => {
    set((state: GraphStore) => ({
      entities: state.entities.map((e) => {
        const dim = dimensions[e.id];
        if (!dim) return e;
        if (e.canvasData.width != null && e.canvasData.height != null) return e;
        return { ...e, canvasData: { ...e.canvasData, ...dim } };
      }),
    }));
  },

  saveContent: (id: string, data: Record<string, unknown>) => {
    contentCache[id] = data;
    set((state: GraphStore) => ({
      contentLoaded: { ...state.contentLoaded, [id]: true },
    }));
    _adapter?.saveDocument(id, data).catch((err) => {
      console.error("Failed to save content:", err);
    });

    const found = new Map<string, string>();
    function walk(node: Record<string, unknown>) {
      if (node.marks && Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === "passageAnchor" && mark.attrs?.segmentId) {
            found.set(mark.attrs.segmentId as string, (node.text as string) ?? "");
          }
        }
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          walk(child as Record<string, unknown>);
        }
      }
    }
    walk(data);

    set((state: GraphStore) => {
      const currentEntities = state.entities;
      const currentContainerEntities = currentEntities.filter(
        (e) => e.type === "annotation" && e.metadata?.sourceContainer === id,
      );

      for (const [segmentId, text] of found) {
        if (!currentEntities.some((e) => e.id === segmentId)) {
          const label = text.length > 60 ? text.slice(0, 60) + "..." : text;
          const now = Date.now();
          currentEntities.push({
            id: segmentId,
            type: "annotation",
            content: "",
            metadata: { sourceContainer: id, label },
            createdAt: now,
            updatedAt: now,
            canvasData: { x: 0, y: 0 },
          });
        }
      }

      for (const entity of currentContainerEntities) {
        if (!found.has(entity.id)) {
          const idx = currentEntities.findIndex((e) => e.id === entity.id);
          if (idx !== -1) {
            currentEntities[idx] = { ...entity, metadata: { ...entity.metadata, stale: true } };
          }
        }
      }

      return { entities: [...currentEntities] };
    });
  },

  clearContent: (id: string) => {
    delete contentCache[id];
    set((state: GraphStore) => {
      const next = { ...state.contentLoaded };
      delete next[id];
      return { contentLoaded: next };
    });
    _adapter?.deleteDocument(id).catch(() => {});
  },

  refreshFolderName: () => {
    const name = _adapter?.getFolderName() ?? null;
    const adapterId = _adapter?.id ?? null;
    set({ folderName: name, adapterId });
  },

  setViewport: (viewport: { x: number; y: number; zoom: number }) => {
    set((state: GraphStore) => ({
      canvas: { ...state.canvas, viewport },
    }));
  },
});

export const useGraphStore = create<GraphStore>(storeInitializer);

let saveTimer: ReturnType<typeof setTimeout> | null = null;

useGraphStore.subscribe((state, prevState) => {
  if (!_hydrated || !_adapter) return;
  if (state.entities === prevState.entities && state.relations === prevState.relations && state.canvas === prevState.canvas) return;

  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    const { entities, relations, canvas } = useGraphStore.getState();
    const snapshot: GraphSnapshot = { version: 5, entities, relations, canvas };
    _adapter!.saveGraph(snapshot).catch((err) => {
      console.error("Failed to save graph:", err);
    });

    const currentState = useGraphStore.getState();
    if (Date.now() - currentState.lastMutationTime >= 2000) {
      const rootHandle = _adapter?.getRootHandle?.() ?? null;
      if (rootHandle) {
        const recentEntries = currentState.undoStack.slice(-10);
        if (recentEntries.length > 0) {
          const entries: AutoBackupEntry[] = recentEntries.map((entry) => {
            const documents: Record<string, Record<string, unknown>> = {};
            for (const entity of entry.entities) {
              if (entity.type === "container") {
                const doc = contentCache[entity.id];
                if (doc) documents[entity.id] = doc;
              }
            }
            return { ...entry, version: 5, documents };
          });
          persistAutoSnapshots(rootHandle, entries).catch(() => {});
        }
      }
    }
  }, 300);
});
