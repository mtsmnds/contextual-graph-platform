import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "./useGraphStore";
import { SEED_DATA } from "../data/seed";

describe("closeWorkspace", () => {
  beforeEach(() => {
    useGraphStore.setState({
      entities: [
        { id: "e1", type: "concept", content: "test", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0, width: 368, height: 64 } },
      ],
      relations: [
        { id: "r1", source: "e1", target: "e2", type: "references", sortOrder: "a0", metadata: {} },
      ],
      canvas: { viewport: { x: 0, y: 0, zoom: 1 }, collapsedContainers: [] },
      view: { focusedEntityId: "e1", anchorEntityId: "e1", visibleEntityIds: [], expandedPanels: [] },
      contentLoaded: { e1: true },
      adapterId: "fs-access",
      folderName: "my-workspace",
      hydrated: true,
      selectedNodeId: "e1",
      undoStack: [{ entities: [], relations: [], canvas: { collapsedContainers: [] }, description: "test", timestamp: 1, version: 5 }],
      redoStack: [],
      batchDepth: 0,
      _pendingSnapshot: null,
      lastMutationTime: 100,
    });
  });

  it("replaces entities with seed data", () => {
    const store = useGraphStore.getState();
    expect(store.entities).toHaveLength(1);

    store.closeWorkspace();

    const after = useGraphStore.getState();
    expect(after.entities).toHaveLength(SEED_DATA.entities.length);
  });

  it("replaces relations with seed data", () => {
    const store = useGraphStore.getState();
    expect(store.relations).toHaveLength(1);

    store.closeWorkspace();

    const after = useGraphStore.getState();
    expect(after.relations).toEqual(SEED_DATA.relations);
  });

  it("resets folderName and adapterId", () => {
    const store = useGraphStore.getState();
    expect(store.folderName).toBe("my-workspace");

    store.closeWorkspace();

    const after = useGraphStore.getState();
    expect(after.folderName).toBeNull();
    expect(after.adapterId).toBeNull();
  });

  it("resets hydrated flag to false", () => {
    const store = useGraphStore.getState();
    expect(store.hydrated).toBe(true);

    store.closeWorkspace();

    const after = useGraphStore.getState();
    expect(after.hydrated).toBe(false);
  });

  it("clears undo and redo stacks", () => {
    const store = useGraphStore.getState();
    expect(store.undoStack).toHaveLength(1);

    store.closeWorkspace();

    const after = useGraphStore.getState();
    expect(after.undoStack).toEqual([]);
    expect(after.redoStack).toEqual([]);
  });

  it("resets view state", () => {
    const store = useGraphStore.getState();
    store.closeWorkspace();

    const after = useGraphStore.getState();
    expect(after.view).toEqual({
      focusedEntityId: null,
      anchorEntityId: null,
      visibleEntityIds: [],
      expandedPanels: [],
    });
  });
});

describe("toggleContainerCollapse", () => {
  beforeEach(() => {
    useGraphStore.setState({
      entities: [],
      relations: [],
      canvas: { collapsedContainers: [] },
      view: { focusedEntityId: null, anchorEntityId: null, visibleEntityIds: [], expandedPanels: [] },
      contentLoaded: {},
      adapterId: null,
      folderName: null,
      hydrated: false,
      selectedNodeId: null,
      undoStack: [],
      redoStack: [],
      batchDepth: 0,
      _pendingSnapshot: null,
      lastMutationTime: 0,
    });
  });

  it("adds a container id when not collapsed", () => {
    const store = useGraphStore.getState();
    expect(store.canvas.collapsedContainers).toEqual([]);

    store.toggleContainerCollapse("container-1");

    const after = useGraphStore.getState();
    expect(after.canvas.collapsedContainers).toEqual(["container-1"]);
  });

  it("removes a container id when already collapsed (toggle off)", () => {
    useGraphStore.setState({
      canvas: { collapsedContainers: ["container-1", "container-2"] },
    });

    const store = useGraphStore.getState();
    store.toggleContainerCollapse("container-1");

    const after = useGraphStore.getState();
    expect(after.canvas.collapsedContainers).toEqual(["container-2"]);
  });

  it("isContainerCollapsed returns correct state", () => {
    const store = useGraphStore.getState();
    expect(store.isContainerCollapsed("container-1")).toBe(false);

    store.toggleContainerCollapse("container-1");
    expect(useGraphStore.getState().isContainerCollapsed("container-1")).toBe(true);

    useGraphStore.getState().toggleContainerCollapse("container-1");
    expect(useGraphStore.getState().isContainerCollapsed("container-1")).toBe(false);
  });

  it("undo restores previous collapsed state", () => {
    const store = useGraphStore.getState();
    store.toggleContainerCollapse("container-1");

    const afterToggle = useGraphStore.getState();
    expect(afterToggle.canvas.collapsedContainers).toEqual(["container-1"]);

    afterToggle.undo();
    const afterUndo = useGraphStore.getState();
    expect(afterUndo.canvas.collapsedContainers).toEqual([]);
  });
});
