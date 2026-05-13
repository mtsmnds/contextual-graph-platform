import type { Node, Edge } from "@xyflow/react";

type NodeKind = "phase" | "task" | "work" | "segment" | "annotation";

type EdgeKind =
  | "dependency"
  | "contains"
  | "references"
  | "translation_of"
  | "commentary_on"
  | "thematic_echo"
  | "parallels";

type EdgeBehavior =
  | "draw-arrow"
  | "expand-lateral"
  | "sync-scroll"
  | "highlight-cross"
  | "open-preview";

type NodeStatus = "pending" | "in-progress" | "done" | "active";

interface NodeData {
  label: string;
  status: NodeStatus;
  specRef?: string;
  [key: string]: unknown;
}

interface EdgeData {
  kind: EdgeKind;
  behavior: EdgeBehavior;
  label?: string;
  [key: string]: unknown;
}

type AppNode = Node<NodeData, NodeKind>;
type AppEdge = Edge<EdgeData>;

export type {
  NodeKind,
  EdgeKind,
  EdgeBehavior,
  NodeStatus,
  NodeData,
  EdgeData,
  AppNode,
  AppEdge,
};
