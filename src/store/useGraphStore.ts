import { create } from "zustand";
import type {
  Entity,
  EntityKind,
  Relation,
  RelationType,
  ViewState,
  GraphSnapshot,
} from "../types/graph";

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const FILE_NAME = "graph.json";

interface GraphStore {
  entities: Entity[];
  relations: Relation[];
  view: ViewState;
  directoryHandle: FileSystemDirectoryHandle | null;
  folderName: string | null;
  saveStatus: SaveStatus;

  addEntity: (kind: EntityKind, data?: Partial<Entity>) => string;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelation: (source: string, target: string, type: RelationType) => string;
  removeRelation: (id: string) => void;

  focusEntity: (id: string | null, anchorId?: string | null) => void;
  expandPanel: (entityId: string) => void;
  closePanel: (entityId: string) => void;

  openFolder: () => Promise<void>;
}

export const useGraphStore = create<GraphStore>((set) => ({
  entities: [],
  relations: [],
  view: {
    focusedEntityId: null,
    anchorEntityId: null,
    visibleEntityIds: [],
    expandedPanels: [],
  },
  directoryHandle: null,
  folderName: null,
  saveStatus: "saved",

  addEntity: (kind, data = {}) => {
    const id = `${kind}_${Date.now()}`;
    const entity: Entity = {
      id,
      kind,
      title: data.title ?? kind,
      content: data.content,
      metadata: data.metadata ?? {},
    };
    set((state) => ({ entities: [...state.entities, entity] }));
    return id;
  },

  updateEntity: (id, data) => {
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === id ? { ...e, ...data, metadata: { ...e.metadata, ...(data.metadata ?? {}) } } : e,
      ),
    }));
  },

  deleteEntity: (id) => {
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relations: state.relations.filter(
        (r) => r.source !== id && r.target !== id,
      ),
    }));
  },

  addRelation: (source, target, type) => {
    const id = `r_${Date.now()}`;
    const relation: Relation = { id, source, target, type, metadata: {} };
    set((state) => ({ relations: [...state.relations, relation] }));
    return id;
  },

  removeRelation: (id) => {
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== id),
    }));
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

  openFolder: async () => {
    if (!window.showDirectoryPicker) return;
    try {
      const handle = await window.showDirectoryPicker();
      const folderName = handle.name;

      let entities: Entity[] = [];
      let relations: Relation[] = [];

      try {
        const fileHandle = await handle.getFileHandle(FILE_NAME);
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data: GraphSnapshot = JSON.parse(text);
        if (data.version === 1) {
          entities = data.entities ?? [];
          relations = data.relations ?? [];
        }
      } catch {
        const fileHandle = await handle.getFileHandle(FILE_NAME, { create: true });
        const writable = await fileHandle.createWritable();
        const snapshot: GraphSnapshot = { version: 1, entities: [], relations: [] };
        await writable.write(JSON.stringify(snapshot, null, 2));
        await writable.close();
      }

      set({
        entities,
        relations,
        directoryHandle: handle,
        folderName,
        saveStatus: "saved",
        view: {
          focusedEntityId: null,
          anchorEntityId: null,
          visibleEntityIds: [],
          expandedPanels: [],
        },
      });
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      console.error("Failed to open folder:", err);
    }
  },
}));

// Auto-save: debounced write to graph.json on every domain state change
let saveTimer: ReturnType<typeof setTimeout> | null = null;

useGraphStore.subscribe((state, prevState) => {
  if (state.entities === prevState.entities && state.relations === prevState.relations) return;
  if (!state.directoryHandle) return;

  if (saveTimer) clearTimeout(saveTimer);

  const store = useGraphStore;

  store.setState({ saveStatus: "unsaved" });

  saveTimer = setTimeout(async () => {
    const { directoryHandle, entities, relations } = store.getState();
    if (!directoryHandle) return;

    try {
      store.setState({ saveStatus: "saving" });
      const fileHandle = await directoryHandle.getFileHandle(FILE_NAME, { create: true });
      const writable = await fileHandle.createWritable();
      const snapshot: GraphSnapshot = { version: 1, entities, relations };
      await writable.write(JSON.stringify(snapshot, null, 2));
      await writable.close();
      store.setState({ saveStatus: "saved" });
    } catch {
      store.setState({ saveStatus: "error" });
    }
  }, 300);
});
