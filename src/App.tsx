import { useMemo, useCallback, useEffect, useRef } from "react";
import type React from "react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "./store/useGraphStore";
import { resolveContainer, getEntity } from "./engine/queries";
import ReadingViewport from "./renderers/ReadingViewport";
import type { Entity, Relation } from "./types/graph";

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

function assignLayout(
  entities: Entity[],
  relations: Relation[],
): { x: number; y: number }[] {
  const children = new Map<string, string[]>();
  const parentOf = new Map<string, string>();

  for (const r of relations) {
    if (r.type === "contains") {
      const kids = children.get(r.source) ?? [];
      kids.push(r.target);
      children.set(r.source, kids);
      parentOf.set(r.target, r.source);
    }
  }

  const ordered = new Map<string, { x: number; y: number }>();
  let y = 0;

  for (const entity of entities) {
    if (parentOf.has(entity.id)) continue;
    ordered.set(entity.id, { x: 0, y });
    y += 150;
    const kids = children.get(entity.id);
    if (kids) {
      let cx = -100;
      for (const kid of kids) {
        ordered.set(kid, { x: cx, y });
        cx += 200;
      }
      y += 150;
    }
  }

  return entities.map((e) => ordered.get(e.id) ?? { x: 0, y: 0 });
}

function toReactFlowNodes(
  entities: Entity[],
  positions: { x: number; y: number }[],
) {
  return entities.map((entity, i) => ({
    id: entity.id,
    type: "default" as const,
    position: positions[i],
    data: {
      label: entity.title ?? entity.id,
      kind: entity.kind,
    },
  }));
}

function toReactFlowEdges(relations: Relation[]) {
  return relations.map((r) => ({
    id: r.id,
    source: r.source,
    target: r.target,
    label: r.type,
    style:
      r.type === "annotates" ? { strokeDasharray: "4 4" } : undefined,
  }));
}

function CanvasView() {
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const focusEntity = useGraphStore((s) => s.focusEntity);

  const { nodes, edges } = useMemo(() => {
    const positions = assignLayout(entities, relations);
    return {
      nodes: toReactFlowNodes(entities, positions),
      edges: toReactFlowEdges(relations),
    };
  }, [entities, relations]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      const state = { entities: useGraphStore.getState().entities, relations: useGraphStore.getState().relations };
      const containerId = resolveContainer(state, node.id);
      focusEntity(containerId, node.id);
    },
    [focusEntity],
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
      />
    </div>
  );
}

function FolderPicker({ onOpen }: { onOpen: () => Promise<void> }) {
  const isSupported = typeof window.showDirectoryPicker === "function";

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md px-6">
          <p className="text-muted-foreground mb-2">
            Your browser does not support the File System Access API.
          </p>
          <p className="text-sm text-muted-foreground">
            Please use Chrome or Edge to open a project folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="px-6 py-3 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
        onClick={onOpen}
      >
        Open a project folder
      </button>
    </div>
  );
}

const saveStatusLabel: Record<string, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Save error",
};

const saveStatusColor: Record<string, string> = {
  saved: "bg-green-500",
  unsaved: "bg-yellow-500",
  saving: "bg-blue-500",
  error: "bg-red-500",
};

function AppHeader() {
  const folderName = useGraphStore((s) => s.folderName);
  const saveStatus = useGraphStore((s) => s.saveStatus);
  const openFolder = useGraphStore((s) => s.openFolder);

  return (
    <header className="flex items-center justify-between border-b shrink-0 px-4 py-1.5">
      <div className="flex items-center gap-2">
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1.5"
          onClick={openFolder}
          title="Switch folder"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {folderName}
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${saveStatusColor[saveStatus] ?? "bg-gray-500"}`} />
        <span className="text-[10px] text-muted-foreground">
          {saveStatusLabel[saveStatus] ?? ""}
        </span>
      </div>
    </header>
  );
}

function getViewParams(): { focused: string | null; anchor: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    focused: params.get("focused"),
    anchor: params.get("anchor"),
  };
}

function updateUrl(focused: string | null, anchor: string | null) {
  const params = new URLSearchParams();
  if (focused) params.set("focused", focused);
  if (anchor) params.set("anchor", anchor);
  const search = params.toString();
  const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
  history.replaceState(null, "", url);
}

function App() {
  const focusedEntityId = useGraphStore((s) => s.view.focusedEntityId);
  const anchorEntityId = useGraphStore((s) => s.view.anchorEntityId);
  const directoryHandle = useGraphStore((s) => s.directoryHandle);
  const openFolder = useGraphStore((s) => s.openFolder);
  const restoreFolder = useGraphStore((s) => s.restoreFolder);
  const focusEntity = useGraphStore((s) => s.focusEntity);

  const hasRestoredFromUrl = useRef(false);

  useEffect(() => {
    restoreFolder();
  }, [restoreFolder]);

  useEffect(() => {
    if (!directoryHandle || hasRestoredFromUrl.current) return;
    hasRestoredFromUrl.current = true;

    const { focused, anchor } = getViewParams();
    if (focused) {
      const state = useGraphStore.getState();
      const entity = getEntity(state, focused);
      if (entity) {
        focusEntity(focused, anchor ?? focused);
      }
    }
  }, [directoryHandle, focusEntity]);

  useEffect(() => {
    if (!directoryHandle) return;

    const timer = setTimeout(() => {
      updateUrl(focusedEntityId, anchorEntityId);
    }, 200);

    return () => clearTimeout(timer);
  }, [focusedEntityId, anchorEntityId, directoryHandle]);

  if (!directoryHandle) {
    return <FolderPicker onOpen={openFolder} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex-1 overflow-hidden">
        {focusedEntityId ? <ReadingViewport /> : <CanvasView />}
      </div>
    </div>
  );
}

export default App;
