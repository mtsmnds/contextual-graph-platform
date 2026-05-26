import { describe, it, expect } from "vitest";
import {
  getEntity,
  getRelations,
  getLinkedContext,
  getContainerChildren,
  getRootContainers,
  resolveContainer,
  getRelationTypes,
  getContainerBreadcrumb,
} from "./queries";
import type { Entity, Relation } from "../types/graph";

const entities: Entity[] = [
  { id: "work-1", type: "container", content: "Hamlet", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "act-1", type: "container", content: "Act I", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "scene-1", type: "container", content: "Scene I", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "seg-1", type: "segment", content: "To be", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "seg-2", type: "segment", content: "Or not", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "ann-1", type: "annotation", content: "Famous line", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "orphan", type: "segment", content: "Alone", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
];

const relations: Relation[] = [
  { id: "r1", source: "work-1", target: "act-1", type: "contains", sortOrder: "a0", metadata: {} },
  { id: "r2", source: "act-1", target: "scene-1", type: "contains", sortOrder: "a0", metadata: {} },
  { id: "r3", source: "scene-1", target: "seg-1", type: "contains", sortOrder: "a0", metadata: {} },
  { id: "r4", source: "scene-1", target: "seg-2", type: "contains", sortOrder: "a1", metadata: {} },
  { id: "r5", source: "seg-1", target: "ann-1", type: "annotates", sortOrder: "a0", metadata: {} },
];

const state = { entities, relations };

describe("getEntity", () => {
  it("returns entity by id", () => {
    expect(getEntity(state, "seg-1")?.content).toBe("To be");
  });

  it("returns undefined for missing id", () => {
    expect(getEntity(state, "nope")).toBeUndefined();
  });
});

describe("getRelations", () => {
  it("returns both incoming and outgoing relations", () => {
    const result = getRelations(state, "scene-1");
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id).sort()).toEqual(["r2", "r3", "r4"]);
  });

  it("returns empty array for entity with no relations", () => {
    expect(getRelations(state, "orphan")).toEqual([]);
  });
});

describe("getLinkedContext", () => {
  it("returns linked entities with their relation", () => {
    const result = getLinkedContext(state, "seg-1");
    expect(result).toHaveLength(2);
    const ann = result.find((x) => x.entity.id === "ann-1");
    expect(ann?.relation.type).toBe("annotates");
  });

  it("excludes linked entities that do not exist in state", () => {
    const brokenState = {
      entities,
      relations: [
        ...relations,
        { id: "r-broken", source: "orphan", target: "ghost", type: "references", sortOrder: "a0", metadata: {} },
      ],
    };
    const result = getLinkedContext(brokenState, "orphan");
    expect(result).toHaveLength(0);
  });

  it("returns empty when entity has no relations", () => {
    expect(getLinkedContext(state, "orphan")).toEqual([]);
  });
});

describe("getContainerChildren", () => {
  it("returns direct children at depth 0", () => {
    const result = getContainerChildren(state, "scene-1", 0);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("seg-1");
    expect(result[1].id).toBe("seg-2");
  });

  it("respects contains sort order", () => {
    const result = getContainerChildren(state, "scene-1", 0);
    expect(result.map((e) => e.id)).toEqual(["seg-1", "seg-2"]);
  });

  it("flattens nested containers recursively with default depth", () => {
    const result = getContainerChildren(state, "work-1");
    expect(result.map((e) => e.id)).toEqual(["act-1", "scene-1", "seg-1", "seg-2"]);
  });

  it("returns empty for container with no children", () => {
    expect(getContainerChildren(state, "ann-1")).toEqual([]);
  });
});

describe("getRootContainers", () => {
  it("returns containers not targeted by any contains relation", () => {
    const result = getRootContainers(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("work-1");
  });

  it("excludes non-container entities", () => {
    const result = getRootContainers(state);
    expect(result.every((e) => e.type === "container")).toBe(true);
  });

  it("returns multiple roots when multiple containers are not contained", () => {
    const multiState = {
      entities: [
        ...entities,
        { id: "work-2", type: "container" as const, content: "Other", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
      ],
      relations,
    };
    expect(getRootContainers(multiState)).toHaveLength(2);
  });
});

describe("resolveContainer", () => {
  it("walks up contains chain to root", () => {
    expect(resolveContainer(state, "seg-1")).toBe("work-1");
  });

  it("returns own id if entity has no parent", () => {
    expect(resolveContainer(state, "work-1")).toBe("work-1");
  });

  it("returns own id for orphan entity", () => {
    expect(resolveContainer(state, "orphan")).toBe("orphan");
  });
});

describe("getRelationTypes", () => {
  it("returns sorted unique relation types", () => {
    expect(getRelationTypes(state)).toEqual(["annotates", "contains"]);
  });

  it("returns empty array when no relations exist", () => {
    expect(getRelationTypes({ entities, relations: [] })).toEqual([]);
  });
});

describe("getContainerBreadcrumb", () => {
  it("builds breadcrumb path from leaf to root", () => {
    const crumbs = getContainerBreadcrumb(state, "seg-1");
    expect(crumbs.map((c) => c.id)).toEqual(["work-1", "act-1", "scene-1", "seg-1"]);
  });

  it("returns single entry for root entity", () => {
    const crumbs = getContainerBreadcrumb(state, "work-1");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].id).toBe("work-1");
  });

  it("stops if entity is missing from state", () => {
    const crumbs = getContainerBreadcrumb(state, "ghost");
    expect(crumbs).toHaveLength(0);
  });

  it("limits to 10 iterations (loop guard)", () => {
    const deep: Entity[] = Array.from({ length: 15 }, (_, i) => ({
      id: `e-${i}`,
      type: "container" as const,
      content: `E${i}`,
      metadata: {},
      createdAt: 1,
      updatedAt: 1,
      canvasData: { x: 0, y: 0 },
    }));
    const deepRels: Relation[] = deep.slice(1).map((e, i) => ({
      id: `r-${i}`,
      source: deep[i].id,
      target: e.id,
      type: "contains",
      sortOrder: "a0",
      metadata: {},
    }));
    const crumbs = getContainerBreadcrumb({ entities: deep, relations: deepRels }, "e-14");
    expect(crumbs).toHaveLength(10);
  });
});
