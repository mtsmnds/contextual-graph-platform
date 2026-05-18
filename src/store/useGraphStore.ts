import { create } from "zustand";
import { generateKeyBetween } from "fractional-indexing";
import type { Entity, EntityKind, Relation, ViewState, GraphSnapshot, CanvasState } from "../types/graph";
import { generateUniqueId } from "../engine/ids";
import { SEED_DATA, SEED_CONTAINER_CONTENT } from "../data/seed";
import type { PersistenceAdapter } from "./persistence";

let _adapter: PersistenceAdapter | null = null;
let _hydrated = false;

const contentCache: Record<string, Record<string, unknown>> = {};

function migrateSnapshot(snapshot: { version: number; entities: Entity[]; relations: Relation[]; canvas?: CanvasState }): GraphSnapshot {
  let entities = snapshot.entities
  let relations = snapshot.relations
  let canvas: CanvasState = snapshot.canvas ?? { positions: {} }
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
      const old = e as Record<string, unknown>
      const oldTitle = old.title as string | undefined
      const oldContent = old.content as string | undefined

      if (oldTitle && oldContent) {
        return {
          ...e,
          content: oldContent,
          metadata: { ...e.metadata, title: oldTitle },
        } as Entity
      }
      return {
        ...e,
        content: oldContent || oldTitle || "",
      } as Entity
    }) as Entity[]
    version = 3
  }

  if (version < 4) {
    canvas = { positions: {} }
    version = 4
  }

  return { version: version as 4, entities, relations, canvas }
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

  init: (adapter: PersistenceAdapter) => Promise<void>;
  addEntity: (kind: EntityKind, data?: Partial<Entity>, parentId?: string | null) => string;
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
  saveContent: (id: string, data: Record<string, unknown>) => void;
  clearContent: (id: string) => void;
  refreshFolderName: () => void;

  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  setCanvasPositions: (positions: Record<string, { x: number; y: number }>) => void;
  replaceCanvasPositions: (positions: Record<string, { x: number; y: number }>) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}

const storeInitializer = (set: any, get: any): GraphStore => ({
  entities: [],
  relations: [],
  canvas: { positions: {} },
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

  init: async (adapter: PersistenceAdapter) => {
    _adapter = adapter;

    const workspace = await adapter.loadWorkspace();

    if (workspace) {
      const migrated = migrateSnapshot(workspace);
      const containerEntities = migrated.entities.filter((e) => e.kind === "container");
      for (const entity of containerEntities) {
        const doc = await adapter.loadDocument(entity.id).catch(() => null);
        if (doc) contentCache[entity.id] = doc;
      }

      set({
        entities: migrated.entities,
        relations: migrated.relations,
        canvas: migrated.canvas,
        contentLoaded: Object.fromEntries(containerEntities.map((e) => [e.id, true])),
        adapterId: adapter.id,
        folderName: adapter.getFolderName(),
      });
    } else {
      const containers = SEED_DATA.entities.filter((e) => e.kind === "container")

      for (const entity of containers) {
        const doc = SEED_CONTAINER_CONTENT[entity.id]
        if (doc) {
          contentCache[entity.id] = doc
          adapter.saveDocument(entity.id, doc).catch(() => {})
        }
      }

      const seedSnapshot: GraphSnapshot = {
        version: 4,
        entities: SEED_DATA.entities,
        relations: SEED_DATA.relations,
        canvas: { positions: {} },
      };
      adapter.saveGraph(seedSnapshot).catch(() => {});

      set({
        entities: SEED_DATA.entities,
        relations: SEED_DATA.relations,
        canvas: { positions: {} },
        contentLoaded: Object.fromEntries(containers.map((e) => [e.id, true])),
        adapterId: adapter.id,
        folderName: adapter.getFolderName(),
      });
    }

    _hydrated = true;
    set({ hydrated: true });
  },

  addEntity: (kind: EntityKind, data?: { content?: string; metadata?: Record<string, unknown> }, parentId: string | null = null) => {
    const existingIds: Set<string> = new Set(get().entities.map((e: Entity) => e.id));
    const siblingCount = parentId
      ? get().entities.filter((e: Entity) => e.id.startsWith(`${parentId}_seg-`)).length
      : 0;
    const content = data?.content ?? ""
    const id = generateUniqueId(parentId, kind, content || kind, existingIds, siblingCount);
    const now = Date.now();
    const entity: Entity = {
      id,
      kind,
      content,
      metadata: data?.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    set((state: GraphStore) => ({ entities: [...state.entities, entity] }));
    return id;
  },

  updateEntity: (id: string, data: Partial<Entity>) => {
    const current = get().entities.find((e: Entity) => e.id === id);
    if (!current) return;

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
          ? { ...e, ...data, metadata: { ...e.metadata, ...(data.metadata ?? {}) }, updatedAt: Date.now() }
          : e,
      ),
    }));
  },

  deleteEntity: (id: string) => {
    delete contentCache[id];
    _adapter?.deleteDocument(id).catch(() => {});
    set((state: GraphStore) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relations: state.relations.filter((r) => r.source !== id && r.target !== id),
    }));
  },

  addRelation: (source: string, target: string, type: string, metadata?: Record<string, unknown>, sortOrder?: string) => {
    const id = `r_${Date.now()}`;
    const order = sortOrder ?? generateKeyBetween(null, null);
    const relation: Relation = { id, source, target, type, sortOrder: order, metadata: metadata ?? {} };
    set((state: GraphStore) => ({ relations: [...state.relations, relation] }));
    return id;
  },

  removeRelation: (id: string) => {
    set((state: GraphStore) => ({ relations: state.relations.filter((r) => r.id !== id) }));
  },

  updateRelation: (id: string, patch: Partial<Relation>) => {
    set((state: GraphStore) => ({
      relations: state.relations.map((r) =>
        r.id === id
          ? { ...r, ...patch, metadata: { ...r.metadata, ...(patch.metadata ?? {}) } }
          : r,
      ),
    }));
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

  saveContent: (id: string, data: Record<string, unknown>) => {
    contentCache[id] = data;
    set((state: GraphStore) => ({
      contentLoaded: { ...state.contentLoaded, [id]: true },
    }));
    _adapter?.saveDocument(id, data).catch((err) => {
      console.error("Failed to save content:", err);
    });

    // Reconciliation: sync annotation entities with passageAnchor marks in the document
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
        (e) => e.kind === "annotation" && e.metadata?.sourceContainer === id,
      );

      for (const [segmentId, text] of found) {
        if (!currentEntities.some((e) => e.id === segmentId)) {
          const label = text.length > 60 ? text.slice(0, 60) + "..." : text;
          const now = Date.now();
          currentEntities.push({
            id: segmentId,
            kind: "annotation",
            content: "",
            metadata: { sourceContainer: id, label },
            createdAt: now,
            updatedAt: now,
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

  setNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    set((state: GraphStore) => ({
      canvas: {
        ...state.canvas,
        positions: { ...state.canvas.positions, [nodeId]: position },
      },
    }));
  },

  setCanvasPositions: (positions: Record<string, { x: number; y: number }>) => {
    set((state: GraphStore) => ({
      canvas: { ...state.canvas, positions: { ...state.canvas.positions, ...positions } },
    }));
  },

  replaceCanvasPositions: (positions: Record<string, { x: number; y: number }>) => {
    set((state: GraphStore) => ({
      canvas: { ...state.canvas, positions },
    }));
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

  saveTimer = setTimeout(() => {
    const { entities, relations, canvas } = useGraphStore.getState();
    const snapshot: GraphSnapshot = { version: 4, entities, relations, canvas };
    _adapter!.saveGraph(snapshot).catch((err) => {
      console.error("Failed to save graph:", err);
    });
  }, 300);
});
