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
      canvas: { viewport: { x: 0, y: 0, zoom: 1 } },
      view: { focusedEntityId: "e1", anchorEntityId: "e1", visibleEntityIds: [], expandedPanels: [] },
      contentLoaded: { e1: true },
      adapterId: "fs-access",
      folderName: "my-workspace",
      hydrated: true,
      selectedNodeId: "e1",
      undoStack: [{ entities: [], relations: [], canvas: {}, description: "test", timestamp: 1, version: 5 }],
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
