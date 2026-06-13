import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useGraphStore } from "./useGraphStore"
import { FSError } from "./persistence/FSAdapter"
import type { GraphSnapshot, Entity } from "../types/graph"

const book1Ch1Snapshot: GraphSnapshot = {
  version: 5,
  entities: [
    { id: "b1-ch1-seg1", type: "segment", content: "Chapter 1 Segment", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 368, height: 64 } },
    { id: "b1-ch1-seg2", type: "segment", content: "Chapter 1 Another", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 10, y: 10, width: 368, height: 64 } },
  ],
  relations: [
    { id: "b1-r1", source: "e1", target: "b1-ch1-seg1", type: "contains", sortOrder: "a0", metadata: {} },
  ],
  canvas: { collapsedContainers: [] },
}

const book1Ch2Snapshot: GraphSnapshot = {
  version: 5,
  entities: [
    { id: "b1-ch2-seg1", type: "segment", content: "Chapter 2 Segment", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 368, height: 64 } },
  ],
  relations: [
    { id: "b1-r2", source: "e1", target: "b1-ch2-seg1", type: "contains", sortOrder: "b0", metadata: {} },
  ],
  canvas: { collapsedContainers: [] },
}

const book2Ch1Snapshot: GraphSnapshot = {
  version: 5,
  entities: [
    { id: "b2-ch1-seg1", type: "segment", content: "Book 2 Segment", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 368, height: 64 } },
  ],
  relations: [
    { id: "b2-r1", source: "e1", target: "b2-ch1-seg1", type: "contains", sortOrder: "c0", metadata: {} },
  ],
  canvas: { collapsedContainers: [] },
}

const testManifest = {
  version: 1 as const,
  main: "graph.json",
  collections: {
    "book-1": {
      type: "book" as const,
      content: { en: "book-1/content-en.json" },
      chapters: { "en-c1": "book-1/EN-c1.json", "en-c2": "book-1/EN-c2.json" },
      notes: "book-1/notes.json",
    },
    "book-2": {
      type: "book" as const,
      content: { en: "book-2/content-en.json" },
      chapters: { "en-c1": "book-2/EN-c1.json" },
      notes: "book-2/notes.json",
    },
  },
}

function createMockFsAdapter(manifest: typeof testManifest | null, subFiles: Record<string, GraphSnapshot>) {
  return {
    getManifest: vi.fn().mockReturnValue(manifest),
    getRootHandle: vi.fn().mockReturnValue({ name: "test-workspace" }),
    loadSubFile: vi.fn().mockImplementation(async (_dirHandle: unknown, path: string) => {
      const data = subFiles[path]
      if (!data) throw new FSError("NOT_FOUND", `sub-file not found: ${path}`)
      return data
    }),
    close: vi.fn(),
  }
}

describe("useGraphStore - multi-file graph loading", () => {
  beforeEach(() => {
    useGraphStore.setState({
      entities: [],
      relations: [],
      canvas: { collapsedContainers: [] },
      contentLoaded: {},
      manifest: null,
      loadedCollections: {},
      adapterId: null,
      folderName: null,
      hydrated: false,
      undoStack: [],
      redoStack: [],
      batchDepth: 0,
      lastMutationTime: 0,
      lastDiskSaveAt: 0,
    })
  })

  afterEach(() => {
    useGraphStore.getState().setFsAdapter(null)
  })

  describe("isBookLoaded", () => {
    it("returns false when no book is loaded", () => {
      expect(useGraphStore.getState().isBookLoaded("book-1")).toBe(false)
    })

    it("returns true after a book is loaded", () => {
      useGraphStore.setState({
        loadedCollections: {
          "book-1": { entityIds: new Set(["e1"]), relationIds: new Set(["r1"]) },
        },
      })
      expect(useGraphStore.getState().isBookLoaded("book-1")).toBe(true)
    })

    it("returns false after a book is unloaded", () => {
      useGraphStore.setState({
        loadedCollections: {
          "book-1": { entityIds: new Set(["e1"]), relationIds: new Set(["r1"]) },
        },
      })
      useGraphStore.getState().unloadBookContent("book-1")
      expect(useGraphStore.getState().isBookLoaded("book-1")).toBe(false)
    })
  })

  describe("loadBookContent", () => {
    it("loads entities and relations from sub-files into the store", async () => {
      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
        "book-1/EN-c2.json": book1Ch2Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)
      useGraphStore.setState({ manifest: testManifest, loadedCollections: {} })

      await useGraphStore.getState().loadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(3)
      expect(state.entities.find((e) => e.id === "b1-ch1-seg1")).toBeDefined()
      expect(state.entities.find((e) => e.id === "b1-ch2-seg1")).toBeDefined()
      expect(state.relations).toHaveLength(2)
      expect(state.isBookLoaded("book-1")).toBe(true)
    })

    it("is idempotent (calling twice does not duplicate)", async () => {
      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
        "book-1/EN-c2.json": book1Ch2Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)
      useGraphStore.setState({ manifest: testManifest, loadedCollections: {} })

      await useGraphStore.getState().loadBookContent("book-1")
      await useGraphStore.getState().loadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(3)
      expect(state.relations).toHaveLength(2)
    })

    it("is a no-op when manifest is null (single-file mode)", async () => {
      const mockAdapter = createMockFsAdapter(null, {})
      useGraphStore.getState().setFsAdapter(mockAdapter as any)
      useGraphStore.setState({ manifest: null, loadedCollections: {} })

      await useGraphStore.getState().loadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(0)
      expect(state.relations).toHaveLength(0)
      expect(state.isBookLoaded("book-1")).toBe(false)
    })

    it("skips missing sub-files gracefully (NOT_FOUND)", async () => {
      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)
      useGraphStore.setState({ manifest: testManifest, loadedCollections: {} })

      await useGraphStore.getState().loadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(2)
      expect(state.entities.find((e) => e.id === "b1-ch1-seg1")).toBeDefined()
      expect(state.entities.find((e) => e.id === "b1-ch1-seg2")).toBeDefined()
      expect(state.relations).toHaveLength(1)
    })

    it("handles a missing notes file gracefully", async () => {
      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
        "book-1/EN-c2.json": book1Ch2Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)
      useGraphStore.setState({ manifest: testManifest, loadedCollections: {} })

      await useGraphStore.getState().loadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(3)
      expect(state.relations).toHaveLength(2)
    })

    it("deduplicates entities already in the base layer", async () => {
      const baseEntity: Entity = { id: "shared-e1", type: "segment", content: "Base", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 368, height: 64 } }
      useGraphStore.setState({
        entities: [baseEntity],
        manifest: testManifest,
        loadedCollections: {},
      })

      const snapshotWithDup: GraphSnapshot = {
        version: 5,
        entities: [
          { id: "shared-e1", type: "segment", content: "From sub-file", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 368, height: 64 } },
          { id: "new-e1", type: "segment", content: "New", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 368, height: 64 } },
        ],
        relations: [],
        canvas: { collapsedContainers: [] },
      }

      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": snapshotWithDup,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)

      await useGraphStore.getState().loadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(2)
      // Base entity kept its original content (not overwritten)
      expect(state.entities.find((e) => e.id === "shared-e1")!.content).toBe("Base")
      // New entity was added
      expect(state.entities.find((e) => e.id === "new-e1")).toBeDefined()
    })
  })

  describe("unloadBookContent", () => {
    it("removes only the loaded entities/relations", async () => {
      useGraphStore.setState({
        entities: [
          { id: "base-e1", type: "container", content: "Base", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 400, height: 300 } },
        ],
        manifest: testManifest,
        loadedCollections: {},
      })

      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
        "book-1/EN-c2.json": book1Ch2Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)

      await useGraphStore.getState().loadBookContent("book-1")
      expect(useGraphStore.getState().entities).toHaveLength(4) // 1 base + 3 loaded

      useGraphStore.getState().unloadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(1)
      expect(state.entities[0].id).toBe("base-e1")
      expect(state.relations).toHaveLength(0)
      expect(state.isBookLoaded("book-1")).toBe(false)
    })

    it("is a no-op for a book that was never loaded", () => {
      const entities: Entity[] = [
        { id: "e1", type: "container", content: "Root", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 400, height: 300 } },
      ]
      useGraphStore.setState({ entities, loadedCollections: {} })

      useGraphStore.getState().unloadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(1)
    })

    it("base-layer entities are never removed by unload", async () => {
      const baseEntity: Entity = { id: "shared-e1", type: "container", content: "Base", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 400, height: 300 } }
      useGraphStore.setState({
        entities: [baseEntity],
        manifest: testManifest,
        loadedCollections: {},
      })

      const snapshotWithDup: GraphSnapshot = {
        version: 5,
        entities: [
          { id: "shared-e1", type: "container", content: "From sub-file", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 400, height: 300 } },
        ],
        relations: [],
        canvas: { collapsedContainers: [] },
      }

      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": snapshotWithDup,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)

      await useGraphStore.getState().loadBookContent("book-1")
      expect(useGraphStore.getState().entities).toHaveLength(1) // dup not added

      useGraphStore.getState().unloadBookContent("book-1")

      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(1)
      expect(state.entities[0].id).toBe("shared-e1")
    })
  })

  describe("loading two different books", () => {
    it("adds both sets without interference", async () => {
      useGraphStore.setState({
        entities: [
          { id: "base-e1", type: "container", content: "Base", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 400, height: 300 } },
        ],
        manifest: testManifest,
        loadedCollections: {},
      })

      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
        "book-1/EN-c2.json": book1Ch2Snapshot,
        "book-2/EN-c1.json": book2Ch1Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)

      await useGraphStore.getState().loadBookContent("book-1")
      expect(useGraphStore.getState().entities).toHaveLength(4)

      await useGraphStore.getState().loadBookContent("book-2")
      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(5)
      expect(state.entities.find((e) => e.id === "b2-ch1-seg1")).toBeDefined()
      expect(state.isBookLoaded("book-1")).toBe(true)
      expect(state.isBookLoaded("book-2")).toBe(true)
    })

    it("unloading one book does not affect the other", async () => {
      useGraphStore.setState({
        entities: [
          { id: "base-e1", type: "container", content: "Base", metadata: {}, createdAt: 1000, updatedAt: 1000, canvasData: { x: 0, y: 0, width: 400, height: 300 } },
        ],
        manifest: testManifest,
        loadedCollections: {},
      })

      const mockAdapter = createMockFsAdapter(testManifest, {
        "book-1/EN-c1.json": book1Ch1Snapshot,
        "book-1/EN-c2.json": book1Ch2Snapshot,
        "book-2/EN-c1.json": book2Ch1Snapshot,
      })
      useGraphStore.getState().setFsAdapter(mockAdapter as any)

      await useGraphStore.getState().loadBookContent("book-1")
      await useGraphStore.getState().loadBookContent("book-2")
      expect(useGraphStore.getState().entities).toHaveLength(5)

      useGraphStore.getState().unloadBookContent("book-1")
      const state = useGraphStore.getState()
      expect(state.entities).toHaveLength(2) // base + book-2
      expect(state.entities.find((e) => e.id === "b2-ch1-seg1")).toBeDefined()
      expect(state.entities.find((e) => e.id === "b1-ch1-seg1")).toBeUndefined()
    })
  })
})
