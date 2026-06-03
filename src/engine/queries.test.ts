import { describe, it, expect } from "vitest";
import { getParentId, getChildIds, hasChildren } from "./queries";
import type { Relation } from "../types/graph";

describe("getParentId", () => {
  const relations: Relation[] = [
    { id: "r1", source: "A", target: "B", type: "contains", sortOrder: "a0", metadata: {} },
    { id: "r2", source: "B", target: "C", type: "contains", sortOrder: "a1", metadata: {} },
  ];

  it("finds parent via contains edge", () => {
    expect(getParentId({ relations }, "B")).toBe("A");
    expect(getParentId({ relations }, "C")).toBe("B");
  });

  it("returns undefined for entity with no parent", () => {
    expect(getParentId({ relations }, "A")).toBeUndefined();
    expect(getParentId({ relations }, "Z")).toBeUndefined();
  });

  it("returns undefined for empty relations", () => {
    expect(getParentId({ relations: [] }, "A")).toBeUndefined();
  });
});

describe("getChildIds", () => {
  const relations: Relation[] = [
    { id: "r1", source: "A", target: "C", type: "contains", sortOrder: "b0", metadata: {} },
    { id: "r2", source: "A", target: "B", type: "contains", sortOrder: "a0", metadata: {} },
    { id: "r3", source: "A", target: "D", type: "contains", sortOrder: "c0", metadata: {} },
    { id: "r4", source: "B", target: "E", type: "contains", sortOrder: "a0", metadata: {} },
  ];

  it("returns sorted child IDs for a parent", () => {
    const children = getChildIds({ relations }, "A");
    expect(children).toEqual(["B", "C", "D"]); // sorted by sortOrder
  });

  it("returns empty array for leaf node", () => {
    expect(getChildIds({ relations }, "E")).toEqual([]);
  });

  it("returns empty array for entity with no children", () => {
    expect(getChildIds({ relations }, "Z")).toEqual([]);
  });
});

describe("hasChildren", () => {
  const relations: Relation[] = [
    { id: "r1", source: "A", target: "B", type: "contains", sortOrder: "a0", metadata: {} },
    { id: "r2", source: "A", target: "C", type: "related_to", sortOrder: "a1", metadata: {} },
  ];

  it("returns true for entity with outgoing contains edges", () => {
    expect(hasChildren({ relations }, "A")).toBe(true);
  });

  it("returns false for entity with only non-contains edges", () => {
    // C has no outgoing contains edges, even though it's targeted by a related_to edge
    expect(hasChildren({ relations }, "C")).toBe(false);
  });

  it("returns false for leaf entity", () => {
    expect(hasChildren({ relations }, "B")).toBe(false);
  });

  it("returns false for entity with no edges", () => {
    expect(hasChildren({ relations }, "Z")).toBe(false);
  });
});
