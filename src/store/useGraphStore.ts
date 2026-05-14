import { create } from "zustand";
import type {
  Entity,
  EntityKind,
  Relation,
  RelationType,
  ViewState,
  GraphSnapshot,
} from "../types/graph";
import { FEATURES } from "../config";
import { saveHandle, loadHandle } from "../persistence";
import { generateUniqueId } from "../engine/ids";

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandle {
    requestPermission(descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>;
    queryPermission(descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  }
}

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const FILE_NAME = "graph.json";

let _hydrated = false;

interface GraphStore {
  entities: Entity[];
  relations: Relation[];
  view: ViewState;
  directoryHandle: FileSystemDirectoryHandle | null;
  folderName: string | null;
  saveStatus: SaveStatus;

  addEntity: (kind: EntityKind, data?: Partial<Entity>, parentId?: string | null) => string;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelation: (source: string, target: string, type: RelationType) => string;
  removeRelation: (id: string) => void;

  focusEntity: (id: string | null, anchorId?: string | null) => void;
  expandPanel: (entityId: string) => void;
  closePanel: (entityId: string) => void;

  openFolder: () => Promise<void>;
  restoreFolder: () => Promise<boolean>;
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
  directoryHandle: null,
  folderName: null,
  saveStatus: "saved",

  addEntity: (kind, data = {}, parentId = null) => {
    const existingIds: Set<string> = new Set(get().entities.map((e: Entity) => e.id));
    const siblingCount = parentId
      ? get().entities.filter((e: Entity) => e.id.startsWith(`${parentId}_seg-`)).length
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

  restoreFolder: async () => {
    if (!FEATURES.PERSIST_HANDLE) return false;
    if (!window.showDirectoryPicker) return false;
    try {
      const handle = await loadHandle();
      if (!handle) return false;
      const permission = await handle.requestPermission({ mode: "readwrite" });
      if (permission !== "granted") return false;

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
        folderName: handle.name,
        saveStatus: "saved",
        view: {
          focusedEntityId: null,
          anchorEntityId: null,
          visibleEntityIds: [],
          expandedPanels: [],
        },
      });

      _hydrated = true;
      return true;
    } catch (err) {
      console.error("Failed to restore folder:", err);
      return false;
    }
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

      _hydrated = true;

      if (FEATURES.PERSIST_HANDLE) {
        saveHandle(handle).catch((err) =>
          console.error("Failed to persist directory handle:", err),
        );
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      console.error("Failed to open folder:", err);
    }
  },
}));

// Auto-save: debounced write to graph.json on every domain state change
let saveTimer: ReturnType<typeof setTimeout> | null = null;

useGraphStore.subscribe((state, prevState) => {
  if (!_hydrated) return;
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
