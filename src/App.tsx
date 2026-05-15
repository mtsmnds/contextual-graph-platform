import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type React from "react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MoreHorizontal, BookOpen, MapIcon, StickyNote, Folder, Layout } from "lucide-react";
import { useGraphStore } from "./store/useGraphStore";
import { resolveContainer, getEntity, getRootContainers } from "./engine/queries";
import ReadingViewport from "./renderers/ReadingViewport";
import type { Entity, Relation } from "./types/graph";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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

function SidebarPopover() {
  const [open, setOpen] = useState(false);
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const folderName = useGraphStore((s) => s.folderName);
  const saveStatus = useGraphStore((s) => s.saveStatus);
  const focusEntity = useGraphStore((s) => s.focusEntity);
  const openFolder = useGraphStore((s) => s.openFolder);

  const state = { entities, relations };

  const rootContainers = useMemo(
    () => getRootContainers(state),
    [entities, relations],
  );

  const saveDotClass =
    saveStatus === "saved" ? "bg-green-500" :
    saveStatus === "unsaved" ? "bg-yellow-500" :
    saveStatus === "saving" ? "bg-blue-500" :
    "bg-red-500";

  const saveLabel =
    saveStatus === "saved" ? "Saved" :
    saveStatus === "unsaved" ? "Unsaved" :
    saveStatus === "saving" ? "Saving…" :
    "Error";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon-sm"
                className="fixed top-2 right-2 z-40 h-7 w-7 data-[state=open]:bg-accent">
          <MoreHorizontal />
        </Button>
      } />
      <PopoverContent className="w-56 overflow-hidden rounded-lg p-0" align="end">
        <Sidebar collapsible="none" className="bg-transparent">
          <SidebarContent>
            {rootContainers.length > 0 && (
              <SidebarGroup className="border-b last:border-none">
                <SidebarGroupContent className="gap-0">
                  <SidebarMenu>
                    {rootContainers.map((entity) => (
                      <SidebarMenuItem key={entity.id}>
                        <SidebarMenuButton onClick={() => { focusEntity(entity.id); setOpen(false); }}>
                          {entity.metadata?.type === "work" ? <BookOpen /> :
                           entity.metadata?.type === "roadmap" ? <MapIcon /> :
                           <StickyNote />}
                          <span>{entity.title ?? entity.id}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            <SidebarGroup>
              <SidebarGroupContent className="gap-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => { focusEntity(null); setOpen(false); }}>
                      <Layout />
                      <span>Canvas View</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => { openFolder(); setOpen(false); }}>
                      <Folder />
                      <span>Switch Folder…</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="flex flex-row items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
            <Folder className="size-3 shrink-0" />
            <span className="truncate">{folderName}</span>
            <span className="ml-auto flex items-center gap-1 shrink-0">
              <span className={`size-1.5 rounded-full ${saveDotClass}`} />
              {saveLabel}
            </span>
          </SidebarFooter>
        </Sidebar>
      </PopoverContent>
    </Popover>
  );
}

function getViewParams(): { view: string | null; focused: string | null; anchor: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get("view"),
    focused: params.get("focused"),
    anchor: params.get("anchor"),
  };
}

function updateUrl(view: string | null, focused: string | null, anchor: string | null) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
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

    const { view, focused, anchor } = getViewParams();
    if (view === "graph") {
      focusEntity(null);
    } else if (focused) {
      const state = useGraphStore.getState();
      const entity = getEntity(state, focused);
      if (entity) {
        focusEntity(focused, anchor ?? focused);
      }
    }
  }, [directoryHandle, focusEntity]);

  useEffect(() => {
    if (!directoryHandle) return;

    const view = focusedEntityId ? "page" : "graph";
    const timer = setTimeout(() => {
      updateUrl(view, focusedEntityId, anchorEntityId);
    }, 200);

    return () => clearTimeout(timer);
  }, [focusedEntityId, anchorEntityId, directoryHandle]);

  if (!directoryHandle) {
    return <FolderPicker onOpen={openFolder} />;
  }

  return (
    <SidebarProvider className="contents">
      <SidebarPopover />
      <div className="h-screen overflow-hidden">
        {focusedEntityId ? <ReadingViewport /> : <CanvasView />}
      </div>
    </SidebarProvider>
  );
}

export default App;
