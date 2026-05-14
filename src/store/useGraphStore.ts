import { create } from "zustand";
import type {
  Entity,
  EntityKind,
  Relation,
  RelationType,
  ViewState,
} from "../types/graph";

const seedEntities: Entity[] = [
  {
    id: "hamlet_1",
    kind: "segment",
    title: "Who's there?",
    content:
      "Bernardo: Who's there?\nFrancisco: Nay, answer me. Stand and unfold yourself.",
    metadata: { source: "hamlet", act: 1, scene: 1 },
  },
  {
    id: "hamlet_2",
    kind: "segment",
    title: "To be, or not to be",
    content:
      "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
    metadata: { source: "hamlet", act: 3, scene: 1 },
  },
  {
    id: "hamlet_3",
    kind: "segment",
    title: "Alas, poor Yorick",
    content:
      "Alas, poor Yorick! I knew him, Horatio: a fellow of infinite jest, of most excellent fancy.",
    metadata: { source: "hamlet", act: 5, scene: 1 },
  },
  {
    id: "note_1",
    kind: "annotation",
    title: "Identity theme",
    content:
      "The play opens with a question of identity — fitting for a story about uncertainty and deception.",
    metadata: {},
  },
  {
    id: "note_2",
    kind: "annotation",
    title: "Famous soliloquy",
    content:
      "This is the most famous passage. Note the existential framing — not just suicide but the human condition.",
    metadata: {},
  },
  {
    id: "act_1",
    kind: "container",
    title: "Act 1",
    content: "The setup: ghost appears, Claudius marries Gertrude.",
    metadata: { source: "hamlet" },
  },
];

const seedRelations: Relation[] = [
  { id: "r_1", source: "act_1", target: "hamlet_1", type: "contains", metadata: {} },
  { id: "r_2", source: "hamlet_1", target: "hamlet_2", type: "next", metadata: {} },
  { id: "r_3", source: "hamlet_2", target: "hamlet_3", type: "next", metadata: {} },
  { id: "r_4", source: "hamlet_2", target: "note_2", type: "annotates", metadata: {} },
  { id: "r_5", source: "hamlet_1", target: "note_1", type: "annotates", metadata: {} },
];

interface GraphStore {
  entities: Entity[];
  relations: Relation[];
  view: ViewState;

  addEntity: (kind: EntityKind, data?: Partial<Entity>) => string;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelation: (
    source: string,
    target: string,
    type: RelationType,
  ) => string;
  removeRelation: (id: string) => void;

  focusEntity: (id: string | null) => void;
  expandPanel: (entityId: string) => void;
  closePanel: (entityId: string) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  entities: seedEntities,
  relations: seedRelations,
  view: {
    focusedEntityId: null,
    visibleEntityIds: [],
    expandedPanels: [],
  },

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

  focusEntity: (id) => {
    set((state) => ({ view: { ...state.view, focusedEntityId: id } }));
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
}));
