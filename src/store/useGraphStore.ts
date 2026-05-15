import { create } from "zustand";
import type { Entity, EntityKind, Relation, RelationType, ViewState, GraphSnapshot } from "../types/graph";
import { generateUniqueId } from "../engine/ids";
import { SEED_DATA } from "../data/seed";

const STORAGE_KEY = "react-roadmap:graph";
const CONTENT_PREFIX = "react-roadmap:content:";

let _hydrated = false;

function getContentKey(id: string): string {
  return `${CONTENT_PREFIX}${id}`;
}

interface GraphStore {
  entities: Entity[];
  relations: Relation[];
  view: ViewState;
  contentLoaded: Record<string, boolean>;

  addEntity: (kind: EntityKind, data?: Partial<Entity>, parentId?: string | null) => string;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelation: (source: string, target: string, type: RelationType) => string;
  removeRelation: (id: string) => void;

  focusEntity: (id: string | null, anchorId?: string | null) => void;
  expandPanel: (entityId: string) => void;
  closePanel: (entityId: string) => void;

  getContent: (id: string) => Record<string, unknown> | null;
  saveContent: (id: string, data: Record<string, unknown>) => void;
  clearContent: (id: string) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  entities: [],
  relations: [],
  view: {
    focusedEntityId: null,
    anchorEntityId: null,
    visibleEntityIds: [],
    expandedPanels: [],
  },
  contentLoaded: {},

  addEntity: (kind, data = {}, parentId = null) => {
    const existingIds: Set<string> = new Set(get().entities.map((e) => e.id));
    const siblingCount = parentId
      ? get().entities.filter((e) => e.id.startsWith(`${parentId}_seg-`)).length
      : 0;
    const id = generateUniqueId(parentId, kind, data.title, existingIds, siblingCount);

    const entity: Entity = {
      id,
      kind,
      title: kind === "segment" ? undefined : (data.title ?? kind),
      content: kind === "container" ? undefined : data.content,
      metadata: data.metadata ?? {},
    };
    set((state) => ({ entities: [...state.entities, entity] }));
    return id;
  },

  updateEntity: (id, data) => {
    const current = get().entities.find((e) => e.id === id);
    if (!current) return;

    let final = { ...data };

    if (current.kind === "segment") delete final.title;

    // Stripping content via updateEntity is no longer the path for containers
    if (current.kind === "container") delete final.content;

    if (final.id && final.id !== id) {
      const oldId = id;
      const newId = final.id;
      set((state) => ({
        relations: state.relations.map((r) => ({
          ...r,
          source: r.source === oldId ? newId : r.source,
          target: r.target === oldId ? newId : r.target,
        })),
      }));
      id = newId;
    }

    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === id
          ? { ...e, ...final, metadata: { ...e.metadata, ...(final.metadata ?? {}) } }
          : e,
      ),
    }));
  },

  deleteEntity: (id) => {
    // Also remove content from storage
    try { localStorage.removeItem(getContentKey(id)) } catch {}
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relations: state.relations.filter((r) => r.source !== id && r.target !== id),
    }));
  },

  addRelation: (source, target, type) => {
    const id = `r_${Date.now()}`;
    const relation: Relation = { id, source, target, type, metadata: {} };
    set((state) => ({ relations: [...state.relations, relation] }));
    return id;
  },

  removeRelation: (id) => {
    set((state) => ({ relations: state.relations.filter((r) => r.id !== id) }));
  },

  focusEntity: (id, anchorId = null) => {
    set((state) => ({
      view: {
        ...state.view,
        focusedEntityId: id,
        anchorEntityId: anchorId ?? id,
        expandedPanels: [],
      },
    }));
  },

  expandPanel: (entityId) => {
    set((state) => ({
      view: {
        ...state.view,
        expandedPanels: state.view.expandedPanels.includes(entityId)
          ? state.view.expandedPanels
          : [...state.view.expandedPanels, entityId],
      },
    }));
  },

  closePanel: (entityId) => {
    set((state) => ({
      view: {
        ...state.view,
        expandedPanels: state.view.expandedPanels.filter((id) => id !== entityId),
      },
    }));
  },

  getContent: (id) => {
    try {
      const stored = localStorage.getItem(getContentKey(id));
      if (stored) return JSON.parse(stored) as Record<string, unknown>;
    } catch {}
    return null;
  },

  saveContent: (id, data) => {
    try {
      localStorage.setItem(getContentKey(id), JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save content:", err);
    }
    set((state) => ({
      contentLoaded: { ...state.contentLoaded, [id]: true },
    }));
  },

  clearContent: (id) => {
    try { localStorage.removeItem(getContentKey(id)) } catch {}
    set((state) => {
      const next = { ...state.contentLoaded };
      delete next[id];
      return { contentLoaded: next };
    });
  },
}));

// Auto-save: debounced write to localStorage on every domain state change
let saveTimer: ReturnType<typeof setTimeout> | null = null;

useGraphStore.subscribe((state, prevState) => {
  if (!_hydrated) return;
  if (state.entities === prevState.entities && state.relations === prevState.relations) return;

  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    const { entities, relations } = useGraphStore.getState();
    try {
      const snapshot: GraphSnapshot = { version: 1, entities, relations };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  }, 300);
});

// Migrate seed data: extract inline content to separate content store keys
function migrateSeedContent(entities: Entity[]): void {
  for (const entity of entities) {
    if (entity.content) {
      const key = getContentKey(entity.id);
      if (!localStorage.getItem(key)) {
        try {
          localStorage.setItem(key, entity.content);
        } catch {}
      }
    }
  }
}

// Initialize: load from localStorage or seed data
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored) as GraphSnapshot;
    if (data.version === 1) {
      // Migrate any existing inline content to the content store
      const entities = data.entities ?? [];
      migrateSeedContent(entities);
      // Strip inline content from entities in-memory (keeps graph lightweight)
      const cleanEntities = entities.map((e) =>
        e.kind === "container" ? { ...e, content: undefined } : e,
      );
      useGraphStore.setState({ entities: cleanEntities, relations: data.relations ?? [] });
    } else {
      throw new Error("Unknown version");
    }
  } else {
    migrateSeedContent(SEED_DATA.entities);
    const cleanSeed = SEED_DATA.entities.map((e) =>
      e.kind === "container" ? { ...e, content: undefined } : e,
    ) as Entity[];
    useGraphStore.setState({ entities: cleanSeed, relations: SEED_DATA.relations });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
  }
} catch (err) {
  console.warn("Failed to load stored data, falling back to seed:", err);
  migrateSeedContent(SEED_DATA.entities);
  const cleanSeed = SEED_DATA.entities.map((e) =>
    e.kind === "container" ? { ...e, content: undefined } : e,
  ) as Entity[];
  useGraphStore.setState({ entities: cleanSeed, relations: SEED_DATA.relations });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
  } catch {
    // localStorage may be unavailable (e.g. Safari private browsing)
  }
}

_hydrated = true;
