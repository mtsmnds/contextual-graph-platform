import { describe, it, expect, beforeEach } from "vitest";
import { wouldCreateCycle, getNestingDepth } from "../engine/queries";
import { useGraphStore } from "./useGraphStore";
import type { Relation } from "../types/graph";

// --- Pure function tests ---

describe("wouldCreateCycle", () => {
  const relations: Relation[] = [
    { id: "r1", source: "A", target: "B", type: "contains", sortOrder: "a0", metadata: {} },
    { id: "r2", source: "B", target: "C", type: "contains", sortOrder: "a1", metadata: {} },
    { id: "r3", source: "C", target: "D", type: "contains", sortOrder: "a2", metadata: {} },
  ];

  it("detects self-nesting", () => {
    expect(wouldCreateCycle({ relations }, "A", "A")).toBe(true);
  });

  it("detects direct child becoming parent", () => {
    expect(wouldCreateCycle({ relations }, "A", "B")).toBe(true);
  });

  it("detects ancestor in chain", () => {
    expect(wouldCreateCycle({ relations }, "A", "D")).toBe(true);
  });

  it("returns false for unrelated entities", () => {
    expect(wouldCreateCycle({ relations }, "A", "Z")).toBe(false);
  });

  it("detects cycle when moving sibling under descendant", () => {
    expect(wouldCreateCycle({ relations }, "B", "C")).toBe(true);
  });

  it("returns false when moving sibling under unrelated root", () => {
    expect(wouldCreateCycle({ relations }, "B", "Y")).toBe(false);
  });
});

describe("getNestingDepth", () => {
  it("returns 0 for root entity", () => {
    expect(getNestingDepth({ relations: [] }, "A")).toBe(0);
  });

  it("returns correct depth for nested entity", () => {
    const relations: Relation[] = [
      { id: "r1", source: "A", target: "B", type: "contains", sortOrder: "a0", metadata: {} },
      { id: "r2", source: "B", target: "C", type: "contains", sortOrder: "a1", metadata: {} },
      { id: "r3", source: "C", target: "D", type: "contains", sortOrder: "a2", metadata: {} },
    ];
    expect(getNestingDepth({ relations }, "D")).toBe(3);
    expect(getNestingDepth({ relations }, "A")).toBe(0);
    expect(getNestingDepth({ relations }, "C")).toBe(2);
  });

  it("returns 0 for entity with no relations", () => {
    expect(getNestingDepth({ relations: [] }, "ghost")).toBe(0);
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
    it("creates a contains edge when parentId is specified", () => {
      const store = useGraphStore.getState();
      const id = store.addEntity("container", { canvasData: { x: 0, y: 0, width: 400, height: 300 } }, "parent-1");
      const entity = useGraphStore.getState().entities.find((e) => e.id === id);
      expect(entity).toBeDefined();
      expect(entity!.type).toBe("container");
      // parentId is not stored on entity
      expect("parentId" in entity!).toBe(false);
      // A contains edge should exist
      const containsRel = useGraphStore.getState().relations.find(
        (r) => r.target === id && r.type === "contains",
      );
      expect(containsRel).toBeDefined();
      expect(containsRel!.source).toBe("parent-1");
    });
  });

  describe("nesting via addRelation", () => {
    it("creates parent-child relationship via contains edge", () => {
      const store = useGraphStore.getState();
      const a = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const b = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      store.addRelation(a, b, "contains", {}, "a0");
      const containsRel = useGraphStore.getState().relations.find(
        (r) => r.source === a && r.target === b && r.type === "contains",
      );
      expect(containsRel).toBeDefined();
    });

    it("prevents self-nesting via wouldCreateCycle", () => {
      const store = useGraphStore.getState();
      const a = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      // Direct self-nesting should be caught
      expect(wouldCreateCycle({ relations: useGraphStore.getState().relations }, a, a)).toBe(true);
    });

    it("allows nesting beyond depth 4 (no depth limit)", () => {
      const store = useGraphStore.getState();
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        store.addEntity("container", { canvasData: { x: 0, y: 0 } });
        ids.push(useGraphStore.getState().entities[useGraphStore.getState().entities.length - 1].id);
      }
      // Nest via addRelation (contains edge)
      for (let i = 1; i < 5; i++) {
        store.addRelation(ids[i - 1], ids[i], "contains", {}, `a${i}`);
      }
      const depth = getNestingDepth({ relations: useGraphStore.getState().relations }, ids[4]);
      expect(depth).toBe(4);
    });
  });

  describe("deleteEntity cascade", () => {
    it("reparents direct children of deleted container", () => {
      const store = useGraphStore.getState();
      const parentId = store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      const childId = store.addEntity("container", { canvasData: { x: 10, y: 10 } }, parentId);
      store.deleteEntity(parentId);
      const child = useGraphStore.getState().entities.find((e) => e.id === childId);
      expect(child).toBeDefined();
      // Child should have no incoming contains edge (reparented to root)
      const childRel = useGraphStore.getState().relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(childRel).toBeUndefined();
      // Position adjusted to absolute
      expect(child!.canvasData.x).toBe(110);
      expect(child!.canvasData.y).toBe(110);
    });

    it("handles deeply nested container deletion", () => {
      const store = useGraphStore.getState();
      const grandparentId = store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      const parentId = store.addEntity("container", { canvasData: { x: 10, y: 10 } }, grandparentId);
      const childId = store.addEntity("segment", { canvasData: { x: 5, y: 5, height: 64 } }, parentId);

      const stateBefore = useGraphStore.getState();
      expect(stateBefore.relations).toHaveLength(2);

      // Verify that setState callback receives the same state as getState
      let capturedRelations: Relation[] | null = null;
      useGraphStore.setState((s) => {
        capturedRelations = s.relations;
        return {};
      });
      expect(capturedRelations).toEqual(stateBefore.relations);

      // Now run the delete
      store.deleteEntity(grandparentId);
      const stateAfter = useGraphStore.getState();
      expect(stateAfter.entities).toHaveLength(2);
      expect(stateAfter.relations).toHaveLength(1);
      const remainingRel = stateAfter.relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(remainingRel).toBeDefined();
      expect(remainingRel!.source).toBe(parentId);
      const parent = stateAfter.entities.find((e) => e.id === parentId)!;
      expect(parent.canvasData.x).toBe(110);
    });

    it("deleteEntity on container deletes associated relations", () => {
      const store = useGraphStore.getState();
      const a = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const b = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
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
    it("undoes drag-to-nest (contains edge creation)", () => {
      const store = useGraphStore.getState();
      const parentId = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const childId = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      store.addRelation(parentId, childId, "contains", {}, "a0");
      const containsBefore = useGraphStore.getState().relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(containsBefore).toBeDefined();
      store.undo();
      const containsAfter = useGraphStore.getState().relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(containsAfter).toBeUndefined();
    });

    it("undoes detach (contains edge removal)", () => {
      const store = useGraphStore.getState();
      const parentId = store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      store.addEntity("container", { canvasData: { x: 10, y: 10 } }, parentId);
      const entities = useGraphStore.getState().entities;
      const childId = entities[1].id;
      // Detach: batch edge removal + position adjustment
      store.beginBatch("Detach");
      const rel = useGraphStore.getState().relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(rel).toBeDefined();
      store.removeRelation(rel!.id);
      store.updateEntity(childId, { canvasData: { x: 110, y: 110 } });
      store.endBatch();
      const containsAfter = useGraphStore.getState().relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(containsAfter).toBeUndefined();
      store.undo();
      // After undo, the original state should be restored
      const state = useGraphStore.getState();
      const containsRestored = state.relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(containsRestored).toBeDefined();
      const child = state.entities.find((e) => e.id === childId)!;
      expect(child.canvasData.x).toBe(10);
    });

    it("undoes parent deletion cascade", () => {
      const store = useGraphStore.getState();
      const parentId = store.addEntity("container", { canvasData: { x: 100, y: 100 } });
      const childId = store.addEntity("container", { canvasData: { x: 10, y: 10 } }, parentId);
      store.deleteEntity(parentId);
      expect(useGraphStore.getState().entities.find((e) => e.id === parentId)).toBeUndefined();
      store.undo();
      const state = useGraphStore.getState();
      expect(state.entities.find((e) => e.id === parentId)).toBeDefined();
      // Contains edge should be restored
      const containsRel = state.relations.find(
        (r) => r.target === childId && r.type === "contains",
      );
      expect(containsRel).toBeDefined();
      expect(containsRel!.source).toBe(parentId);
    });

    it("undoes contains edge removal", () => {
      const store = useGraphStore.getState();
      const parentId = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const childId = store.addEntity("container", { canvasData: { x: 0, y: 0 } });
      const relId = store.addRelation(parentId, childId, "contains", {}, "a0");
      store.removeRelation(relId);
      expect(useGraphStore.getState().relations.find((r) => r.id === relId)).toBeUndefined();
      store.undo();
      expect(useGraphStore.getState().relations.find((r) => r.id === relId)).toBeDefined();
    });
  });
});
