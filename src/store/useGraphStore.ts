import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import type {
  AppNode,
  AppEdge,
  NodeKind,
  EdgeKind,
  EdgeBehavior,
  NodeData,
} from "../types/graph";

const kindToBehavior: Record<EdgeKind, EdgeBehavior> = {
  dependency: "draw-arrow",
  contains: "expand-lateral",
  references: "open-preview",
  translation_of: "sync-scroll",
  commentary_on: "highlight-cross",
  thematic_echo: "expand-lateral",
  parallels: "highlight-cross",
};

interface GraphState {
  nodes: AppNode[];
  edges: AppEdge[];
  documents: Record<string, string>;
  addNode: (
    kind: NodeKind,
    position: { x: number; y: number },
    data?: Partial<NodeData>,
  ) => void;
  deleteNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  addEdge: (source: string, target: string, kind: EdgeKind) => void;
  deleteEdge: (id: string) => void;
  updateDocument: (docId: string, content: string) => void;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [
    {
      id: "phase_1",
      type: "phase",
      position: { x: 0, y: 0 },
      data: { label: "Phase 1", status: "active" },
    },
    {
      id: "task_1",
      type: "task",
      position: { x: -200, y: 100 },
      data: { label: "Research", status: "in-progress" },
      parentId: "phase_1",
    },
    {
      id: "task_2",
      type: "task",
      position: { x: 200, y: 100 },
      data: { label: "Implementation", status: "pending" },
      parentId: "phase_1",
    },
  ],
  edges: [
    {
      id: "edge_task_1_task_2",
      source: "task_1",
      target: "task_2",
      data: { kind: "dependency", behavior: "draw-arrow" },
    },
  ],
  documents: {},

  addNode: (kind, position, data = {}) => {
    const id = `${kind}_${Date.now()}`;
    const node: AppNode = {
      id,
      type: kind,
      position,
      data: {
        label: data.label ?? kind,
        status: data.status ?? "pending",
        specRef: data.specRef,
      },
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter(
        (e) => e.source !== id && e.target !== id,
      ),
    }));
  },

  updateNodeData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }));
  },

  addEdge: (source, target, kind) => {
    const id = `edge_${source}_${target}`;
    const behavior = kindToBehavior[kind];
    const edge: AppEdge = {
      id,
      source,
      target,
      data: { kind, behavior },
    };
    set((state) => ({ edges: [...state.edges, edge] }));
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }));
  },

  updateDocument: (docId, content) => {
    set((state) => ({
      documents: { ...state.documents, [docId]: content },
    }));
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
}));
