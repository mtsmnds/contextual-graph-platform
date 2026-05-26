import { describe, it, expect } from "vitest";
import { migrateSnapshot } from "./useGraphStore";

const MINIMAL_ENTITY = { id: "e1", type: "segment", content: "hello", metadata: {} };
const MINIMAL_RELATION = { id: "r1", source: "e1", target: "e2", type: "references", metadata: {} };

describe("migrateSnapshot", () => {
  describe("v1 → v5 full migration", () => {
    it("adds createdAt/updatedAt to entities", () => {
      const result = migrateSnapshot({
        version: 1,
        entities: [{ ...MINIMAL_ENTITY }],
        relations: [MINIMAL_RELATION],
      });
      expect(result.entities[0].createdAt).toEqual(expect.any(Number));
      expect(result.entities[0].updatedAt).toEqual(expect.any(Number));
    });

    it("adds sortOrder to relations", () => {
      const result = migrateSnapshot({
        version: 1,
        entities: [MINIMAL_ENTITY],
        relations: [MINIMAL_RELATION],
      });
      expect(result.relations[0].sortOrder).toEqual(expect.any(String));
    });

    it("preserves existing createdAt", () => {
      const result = migrateSnapshot({
        version: 1,
        entities: [{ ...MINIMAL_ENTITY, createdAt: 100 }],
        relations: [MINIMAL_RELATION],
      });
      expect(result.entities[0].createdAt).toBe(100);
    });

    it("sets version to 5", () => {
      const result = migrateSnapshot({
        version: 1,
        entities: [MINIMAL_ENTITY],
        relations: [],
      });
      expect(result.version).toBe(5);
    });
  });

  describe("v2 migration (title→content)", () => {
    it("moves title to metadata when both title and content exist", () => {
      const result = migrateSnapshot({
        version: 2,
        entities: [{ id: "e1", type: "segment", title: "Chapter", content: "body", metadata: {} }],
        relations: [],
      });
      expect(result.entities[0].content).toBe("body");
      expect(result.entities[0].metadata.title).toBe("Chapter");
    });

    it("uses title as content when content is missing", () => {
      const result = migrateSnapshot({
        version: 2,
        entities: [{ id: "e1", type: "segment", title: "Alone", metadata: {} }],
        relations: [],
      });
      expect(result.entities[0].content).toBe("Alone");
    });

    it("defaults to empty string when neither title nor content", () => {
      const result = migrateSnapshot({
        version: 2,
        entities: [{ id: "e1", type: "segment", metadata: {} }],
        relations: [],
      });
      expect(result.entities[0].content).toBe("");
    });
  });

  describe("v4 migration (canvas initialization)", () => {
    it("initializes canvas with positions and dimensions for v3", () => {
      const result = migrateSnapshot({
        version: 3,
        entities: [MINIMAL_ENTITY],
        relations: [],
      });
      expect(result.canvas).toEqual({});
    });

    it("strips positions/dimensions from canvas in v5", () => {
      const result = migrateSnapshot({
        version: 4,
        entities: [{ ...MINIMAL_ENTITY, id: "e1" }],
        relations: [],
        canvas: { viewport: { x: 0, y: 0, zoom: 1 }, positions: { e1: { x: 10, y: 20 } }, dimensions: { e1: { width: 200, height: 80 } } as Record<string, unknown> },
      });
      expect(result.canvas.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  describe("v5 migration (canvasData on entity)", () => {
    it("moves position and dimensions into entity.canvasData", () => {
      const result = migrateSnapshot({
        version: 4,
        entities: [{ ...MINIMAL_ENTITY, id: "e1" }],
        relations: [],
        canvas: {
          positions: { e1: { x: 100, y: 200 } },
          dimensions: { e1: { width: 300, height: 80 } },
        },
      });
      expect(result.entities[0].canvasData).toEqual({ x: 100, y: 200, width: 300, height: 80 });
    });

    it("defaults position to 0,0 when missing", () => {
      const result = migrateSnapshot({
        version: 4,
        entities: [{ ...MINIMAL_ENTITY, id: "e1" }],
        relations: [],
        canvas: {},
      });
      expect(result.entities[0].canvasData).toEqual({ x: 0, y: 0 });
    });

    it("omits width/height when dimensions are missing", () => {
      const result = migrateSnapshot({
        version: 4,
        entities: [{ ...MINIMAL_ENTITY, id: "e1" }],
        relations: [],
        canvas: { positions: { e1: { x: 10, y: 20 } } },
      });
      expect(result.entities[0].canvasData).toEqual({ x: 10, y: 20 });
    });
  });

  describe("kind→type normalization", () => {
    it("renames kind to type when type is absent", () => {
      const result = migrateSnapshot({
        version: 5,
        entities: [{ id: "e1", kind: "container", content: "", metadata: {} }],
        relations: [],
      });
      expect(result.entities[0].type).toBe("container");
      expect((result.entities[0] as Record<string, unknown>).kind).toBeUndefined();
    });

    it("keeps type when both kind and type exist", () => {
      const result = migrateSnapshot({
        version: 5,
        entities: [{ id: "e1", type: "segment", kind: "container", content: "", metadata: {} }],
        relations: [],
      });
      expect(result.entities[0].type).toBe("segment");
    });
  });

  describe("combined scenarios", () => {
    it("migrates a realistic v1 snapshot end-to-end", () => {
      const input = {
        version: 1 as const,
        entities: [
          { id: "work-1", kind: "container", title: "Hamlet", content: "The play", metadata: {} },
          { id: "seg-1", kind: "segment", content: "To be", metadata: {} },
        ],
        relations: [
          { id: "r1", source: "work-1", target: "seg-1", type: "contains", metadata: {} },
        ],
      };

      const result = migrateSnapshot(input);
      expect(result.version).toBe(5);
      expect(result.entities).toHaveLength(2);

      const work = result.entities.find((e) => e.id === "work-1")!;
      expect(work.type).toBe("container");
      expect(work.content).toBe("The play");
      expect(work.metadata.title).toBe("Hamlet");

      const seg = result.entities.find((e) => e.id === "seg-1")!;
      expect(seg.type).toBe("segment");
      expect(seg.content).toBe("To be");

      expect(result.relations[0].sortOrder).toEqual(expect.any(String));
      expect(result.canvas).toEqual({});
    });

    it("v5 input only runs kind→type normalization", () => {
      const result = migrateSnapshot({
        version: 5,
        entities: [{ id: "e1", kind: "annotation", content: "note", metadata: {} }],
        relations: [{ id: "r1", source: "e1", target: "e2", type: "references", sortOrder: "a0", metadata: {} }],
        canvas: { viewport: { x: 0, y: 0, zoom: 1 } },
      });
      expect(result.entities[0].type).toBe("annotation");
      expect(result.relations[0].sortOrder).toBe("a0");
      expect(result.canvas.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });
});
