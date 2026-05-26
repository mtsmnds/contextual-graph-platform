import { describe, it, expect, beforeEach } from "vitest";
import { wouldCreateCycle, getNestingDepth } from "../engine/queries";
import { useGraphStore } from "./useGraphStore";
import type { Entity } from "../types/graph";



// --- Pure function tests ---

describe("wouldCreateCycle", () => {
  const entities: Entity[] = [
    { id: "A", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
    { id: "B", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 }, parentId: "A" },
    { id: "C", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 }, parentId: "B" },
    { id: "D", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 }, parentId: "C" },
  ];

  it("detects self-nesting", () => {
    expect(wouldCreateCycle(entities, "A", "A")).toBe(true);
  });

  it("detects direct child becoming parent", () => {
    expect(wouldCreateCycle(entities, "A", "B")).toBe(true);
  });

  it("detects ancestor in chain", () => {
    expect(wouldCreateCycle(entities, "A", "D")).toBe(true);
  });

  it("returns false for unrelated entities", () => {
    const Z: Entity = { id: "Z", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } };
    expect(wouldCreateCycle([...entities, Z], "A", "Z")).toBe(false);
  });

  it("returns false for sibling move", () => {
    expect(wouldCreateCycle(entities, "B", "C")).toBe(true); // C is child of B originally, so B→C is a cycle
  });

  it("returns false when moving sibling under unrelated root", () => {
    const Y: Entity = { id: "Y", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } };
    expect(wouldCreateCycle([...entities, Y], "B", "Y")).toBe(false);
  });
});

describe("getNestingDepth", () => {
  it("returns 0 for root entity", () => {
    expect(getNestingDepth([], "A")).toBe(0);
  });

  it("returns correct depth for nested entity", () => {
    const entities: Entity[] = [
      { id: "A", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
      { id: "B", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 }, parentId: "A" },
      { id: "C", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 }, parentId: "B" },
      { id: "D", type: "container", content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 }, parentId: "C" },
    ];
    expect(getNestingDepth(entities, "D")).toBe(3);
    expect(getNestingDepth(entities, "A")).toBe(0);
    expect(getNestingDepth(entities, "C")).toBe(2);
  });

  it("returns 0 for missing entity", () => {
    expect(getNestingDepth([], "ghost")).toBe(0);
  });
});

// --- Store integration tests ---

describe("store nesting operations", () => {
  beforeEach(() => {
    useGraphStore.setState({
      entities: [],
      relations: [],
      undoStack: [],
      redoStack: [],
      batchDepth: 0,
      _pendingSnapshot: null,
    });
  });

  describe("addEntity with parentId", () => {
    it("creates a container with parentId when specified", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 0, y: 0, width: 400, height: 300 } }, "parent-1");
      const entity = useGraphStore.getState().entities.find((e) => e.parentId === "parent-1");
      expect(entity).toBeDefined();
      expect(entity!.type).toBe("container");
    });
  });

  describe("updateEntity parentId assignment", () => {
    it("rejects self-nesting via wouldCreateCycle", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const id = useGraphStore.getState().entities[0].id;
      store.updateEntity(id, { parentId: id });
      const entity = useGraphStore.getState().entities.find((e) => e.id === id);
      expect(entity!.parentId).toBeUndefined();
    });

    it("rejects cycles", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const entities = useGraphStore.getState().entities;
      const parentId = entities[0].id;
      const childId = entities[1].id;
      store.updateEntity(childId, { parentId });
      store.updateEntity(parentId, { parentId: childId });
      const parent = useGraphStore.getState().entities.find((e) => e.id === parentId)!;
      expect(parent.parentId).toBeUndefined();
    });

    it("allows nesting beyond depth 4 (no depth limit)", () => {
      const store = useGraphStore.getState();
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        store.addEntity("container", { canvasData: { x: 0, y: 0 } });
        ids.push(useGraphStore.getState().entities[useGraphStore.getState().entities.length - 1].id);
      }
      for (let i = 1; i < 5; i++) {
        store.updateEntity(ids[i], { parentId: ids[i - 1] });
      }
      expect(useGraphStore.getState().entities.find((e) => e.id === ids[4])!.parentId).toBe(ids[3]);
    });
  });

  describe("deleteEntity cascade", () => {
    it("reparents direct children of deleted container", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      const parentId = useGraphStore.getState().entities[0].id;
      store.addEntity("container", { canvasData: { x: 10, y: 10 } }, parentId);
      const childId = useGraphStore.getState().entities[1].id;
      store.deleteEntity(parentId);
      const child = useGraphStore.getState().entities.find((e) => e.id === childId);
      expect(child).toBeDefined();
      expect(child!.parentId).toBeUndefined();
      expect(child!.canvasData.x).toBe(110);
      expect(child!.canvasData.y).toBe(110);
    });

    it("handles deeply nested container deletion", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      const grandparentId = useGraphStore.getState().entities[0].id;
      store.addEntity("container", { canvasData: { x: 10, y: 10 } }, grandparentId);
      const parentId = useGraphStore.getState().entities[1].id;
      store.addEntity("segment", { canvasData: { x: 5, y: 5, height: 64 } }, parentId);
      const childId = useGraphStore.getState().entities[2].id;
      store.deleteEntity(grandparentId);
      const state = useGraphStore.getState();
      const parent = state.entities.find((e) => e.id === parentId)!;
      expect(parent.parentId).toBeUndefined();
      expect(parent.canvasData.x).toBe(110);
      const child = state.entities.find((e) => e.id === childId);
      expect(child).toBeDefined();
      expect(child!.parentId).toBe(parentId);
    });

    it("deleteEntity on container deletes associated relations", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const [a, b] = useGraphStore.getState().entities.map((e) => e.id);
      store.addRelation(a, b, "references");
      store.deleteEntity(a);
      const relations = useGraphStore.getState().relations;
      expect(relations.every((r) => r.source !== a && r.target !== a)).toBe(true);
    });

    it("empty container deletion has no side effects", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      store.addEntity("concept", { canvasData: { x: 0, y: 0 } });
      const id = useGraphStore.getState().entities[0].id;
      const entityCount = useGraphStore.getState().entities.length;
      store.deleteEntity(id);
      expect(useGraphStore.getState().entities).toHaveLength(entityCount - 1);
    });
  });

  describe("undo/redo nesting operations", () => {
    it("undoes drag-to-nest", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const entities = useGraphStore.getState().entities;
      const parentId = entities[0].id;
      const childId = entities[1].id;
      store.updateEntity(childId, { parentId });
      expect(useGraphStore.getState().entities.find((e) => e.id === childId)!.parentId).toBe(parentId);
      store.undo();
      expect(useGraphStore.getState().entities.find((e) => e.id === childId)!.parentId).toBeUndefined();
    });

    it("undoes detach", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      store.addEntity("container", { canvasData: { x: 10, y: 10 } });
      const entities = useGraphStore.getState().entities;
      const parentId = entities[0].id;
      const childId = entities[1].id;
      store.updateEntity(childId, { parentId, canvasData: { x: 10, y: 10 } });
      store.updateEntity(childId, { parentId: undefined, canvasData: { x: 110, y: 110 } });
      expect(useGraphStore.getState().entities.find((e) => e.id === childId)!.parentId).toBeUndefined();
      store.undo();
      const child = useGraphStore.getState().entities.find((e) => e.id === childId)!;
      expect(child.parentId).toBe(parentId);
      expect(child.canvasData.x).toBe(10);
    });

    it("undoes parent deletion cascade", () => {
      const store = useGraphStore.getState();
      store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      const parentId = useGraphStore.getState().entities[0].id;
      store.addEntity("container", { canvasData: { x: 10, y: 10 } }, parentId);
      const childId = useGraphStore.getState().entities[1].id;
      store.deleteEntity(parentId);
      expect(useGraphStore.getState().entities.find((e) => e.id === parentId)).toBeUndefined();
      store.undo();
      const state = useGraphStore.getState();
      expect(state.entities.find((e) => e.id === parentId)).toBeDefined();
      expect(state.entities.find((e) => e.id === childId)!.parentId).toBe(parentId);
    });
  });
});
