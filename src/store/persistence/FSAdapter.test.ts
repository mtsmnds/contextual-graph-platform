import { describe, it, expect, beforeEach, vi } from "vitest"
import { FSAdapter, FSError, validateSnapshot, type FSLogEntry } from "./FSAdapter"
import type { GraphSnapshot } from "../../types/graph"

function validSnapshot(): GraphSnapshot {
  return {
    version: 5,
    entities: [
      {
        id: "e1",
        type: "container",
        content: "Test",
        metadata: {},
        createdAt: 1000,
        updatedAt: 1000,
        canvasData: { x: 0, y: 0, width: 400, height: 300 },
      },
      {
        id: "e2",
        type: "segment",
        content: "Child",
        metadata: {},
        createdAt: 1000,
        updatedAt: 1000,
        canvasData: { x: 10, y: 10, width: 368, height: 64 },
      },
    ],
    relations: [
      {
        id: "r1",
        source: "e1",
        target: "e2",
        type: "contains",
        sortOrder: "a0",
        metadata: {},
      },
    ],
    canvas: { viewport: { x: 0, y: 0, zoom: 1 }, collapsedContainers: [] },
  }
}

type MockWritable = {
  write: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

function makeWritable(): MockWritable {
  return {
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
  }
}

function setupMocks(options?: {
  graphJSON?: string | null
  pickerError?: string
  readError?: string
  writeError?: string
  writableError?: string
  fileHandleError?: string
}) {
  const writable = makeWritable()
  if (options?.writableError) {
    writable.write.mockRejectedValue(new Error(options.writableError))
  }

  const fileHandle = {
    getFile: vi.fn().mockImplementation(async () => {
      if (options?.readError) {
        throw new Error(options.readError)
      }
      if (options?.graphJSON === undefined) {
        return { text: async () => JSON.stringify(validSnapshot()) }
      }
      if (options.graphJSON === null) {
        throw new DOMException("", "NotFoundError")
      }
      return { text: async () => options.graphJSON }
    }),
    createWritable: vi.fn().mockImplementation(async () => {
      if (options?.fileHandleError) {
        throw new Error(options.fileHandleError)
      }
      return writable
    }),
  }

  const dirHandle = {
    name: "test-workspace",
    getFileHandle: vi.fn().mockImplementation(async (name: string) => {
      if (options?.fileHandleError) {
        throw new Error(options.fileHandleError)
      }
      if (name === "graph.json" && options?.graphJSON === null) {
        throw new DOMException("", "NotFoundError")
      }
      return fileHandle
    }),
    queryPermission: vi.fn(),
  }

  const showDirectoryPicker = vi.fn().mockImplementation(async () => {
    if (options?.pickerError === "AbortError") {
      throw new DOMException("", "AbortError")
    }
    if (options?.pickerError) {
      throw new Error(options.pickerError)
    }
    return dirHandle
  })

  ;(window as any).showDirectoryPicker = showDirectoryPicker

  return { dirHandle, fileHandle, writable, showDirectoryPicker }
}

describe("FSError", () => {
  it("sets code, detail, and message", () => {
    const err = new FSError("NOT_FOUND", 'graph.json not found in "test"')
    expect(err.code).toBe("NOT_FOUND")
    expect(err.detail).toBe('graph.json not found in "test"')
    expect(err.message).toBe('[NOT_FOUND] graph.json not found in "test"')
    expect(err.name).toBe("FSError")
  })
})

describe("validateSnapshot", () => {
  it("accepts a valid version-5 snapshot", () => {
    const result = validateSnapshot(validSnapshot())
    expect(result.version).toBe(5)
    expect(result.entities).toHaveLength(2)
    expect(result.relations).toHaveLength(1)
    expect(result.canvas.viewport).toBeDefined()
  })

  it("accepts a snapshot without canvas", () => {
    const { canvas: _, ...noCanvas } = validSnapshot()
    const result = validateSnapshot(noCanvas)
    expect(result.version).toBe(5)
    expect(result.canvas).toEqual({})
  })

  it("rejects null", () => {
    expect(() => validateSnapshot(null)).toThrow(FSError)
    expect(() => validateSnapshot(null)).toThrow("VALIDATION_FAILED")
  })

  it("rejects undefined", () => {
    expect(() => validateSnapshot(undefined)).toThrow(FSError)
    expect(() => validateSnapshot(undefined)).toThrow("VALIDATION_FAILED")
  })

  it("rejects non-object primitives", () => {
    expect(() => validateSnapshot("string")).toThrow("expected object, got string")
    expect(() => validateSnapshot(42)).toThrow("expected object, got number")
    expect(() => validateSnapshot(true)).toThrow("expected object, got boolean")
  })

  it("rejects arrays", () => {
    expect(() => validateSnapshot([])).toThrow("expected object, got array")
  })

  it("rejects missing version", () => {
    expect(() => validateSnapshot({ entities: [], relations: [] })).toThrow("version is not a number")
  })

  it("rejects version > 5", () => {
    const data = { ...validSnapshot(), version: 6 }
    expect(() => validateSnapshot(data)).toThrow("VERSION_TOO_NEW")
    expect(() => validateSnapshot(data)).toThrow("6 is newer than supported version 5")
  })

  it("accepts version 5", () => {
    expect(() => validateSnapshot(validSnapshot())).not.toThrow()
  })

  it("accepts version < 5 (will be migrated)", () => {
    const data = { ...validSnapshot(), version: 3 }
    expect(() => validateSnapshot(data)).not.toThrow()
  })

  it("rejects missing entities", () => {
    expect(() => validateSnapshot({ version: 5 })).toThrow("entities is not an array")
  })

  it("rejects missing relations", () => {
    expect(() => validateSnapshot({ version: 5, entities: [] })).toThrow("relations is not an array")
  })

  it("rejects entities with missing id", () => {
    const data = { version: 5, entities: [{ type: "segment", content: "", metadata: {}, canvasData: { x: 0, y: 0, width: 100, height: 100 } }], relations: [] }
    expect(() => validateSnapshot(data)).toThrow("entities[0].id is not a string")
  })

  it("rejects entities with missing type", () => {
    const data = { version: 5, entities: [{ id: "e1", content: "", metadata: {}, canvasData: { x: 0, y: 0, width: 100, height: 100 } }], relations: [] }
    expect(() => validateSnapshot(data)).toThrow("entities[0].type is not a string")
  })

  it("rejects entities with missing content", () => {
    const data = { version: 5, entities: [{ id: "e1", type: "segment", metadata: {}, canvasData: { x: 0, y: 0, width: 100, height: 100 } }], relations: [] }
    expect(() => validateSnapshot(data)).toThrow("entities[0].content is not a string")
  })

  it("rejects entities with missing metadata", () => {
    const data = { version: 5, entities: [{ id: "e1", type: "segment", content: "", canvasData: { x: 0, y: 0, width: 100, height: 100 } }], relations: [] }
    expect(() => validateSnapshot(data)).toThrow("entities[0].metadata is not an object")
  })

  it("rejects entities with missing canvasData", () => {
    const data = { version: 5, entities: [{ id: "e1", type: "segment", content: "", metadata: {} }], relations: [] }
    expect(() => validateSnapshot(data)).toThrow("entities[0].canvasData is not an object")
  })

  it("rejects relations with missing id", () => {
    const data = { version: 5, entities: [], relations: [{ source: "e1", target: "e2", type: "contains", sortOrder: "a0" }] }
    expect(() => validateSnapshot(data)).toThrow("relations[0].id is not a string")
  })

  it("rejects relations with missing source", () => {
    const data = { version: 5, entities: [], relations: [{ id: "r1", target: "e2", type: "contains", sortOrder: "a0" }] }
    expect(() => validateSnapshot(data)).toThrow("relations[0].source is not a string")
  })

  it("rejects relations with missing target", () => {
    const data = { version: 5, entities: [], relations: [{ id: "r1", source: "e1", type: "contains", sortOrder: "a0" }] }
    expect(() => validateSnapshot(data)).toThrow("relations[0].target is not a string")
  })

  it("rejects relations with missing type", () => {
    const data = { version: 5, entities: [], relations: [{ id: "r1", source: "e1", target: "e2", sortOrder: "a0" }] }
    expect(() => validateSnapshot(data)).toThrow("relations[0].type is not a string")
  })

  it("rejects relations with missing sortOrder", () => {
    const data = { version: 5, entities: [], relations: [{ id: "r1", source: "e1", target: "e2", type: "contains" }] }
    expect(() => validateSnapshot(data)).toThrow("relations[0].sortOrder is not a string")
  })

  it("rejects canvas that is an array", () => {
    const data = { ...validSnapshot(), canvas: [] }
    expect(() => validateSnapshot(data)).toThrow("canvas is not an object")
  })
})

describe("FSAdapter", () => {
  let adapter: FSAdapter

  beforeEach(() => {
    adapter = new FSAdapter()
    vi.restoreAllMocks()
  })

  describe("initial state", () => {
    it("is not open initially", () => {
      expect(adapter.isOpen()).toBe(false)
      expect(adapter.getFolderName()).toBeNull()
      expect(adapter.getStatus()).toBe("idle")
      expect(adapter.getLog()).toEqual([])
    })
  })

  describe("open()", () => {
    it("returns a snapshot when folder has valid graph.json", async () => {
      setupMocks()
      const result = await adapter.open()
      expect(result).not.toBeNull()
      expect(result!.version).toBe(5)
      expect(result!.entities).toHaveLength(2)
      expect(result!.relations).toHaveLength(1)
    })

    it("sets isOpen() and getFolderName() after successful open", async () => {
      setupMocks()
      await adapter.open()
      expect(adapter.isOpen()).toBe(true)
      expect(adapter.getFolderName()).toBe("test-workspace")
      expect(adapter.getStatus()).toBe("open")
    })

    it("returns null when user cancels the picker", async () => {
      setupMocks({ pickerError: "AbortError" })
      const result = await adapter.open()
      expect(result).toBeNull()
      expect(adapter.isOpen()).toBe(false)
    })

    it("returns null when folder has no graph.json (isOpen remains true)", async () => {
      setupMocks({ graphJSON: null })
      const result = await adapter.open()
      expect(result).toBeNull()
      expect(adapter.isOpen()).toBe(true)
      expect(adapter.getFolderName()).toBe("test-workspace")
    })

    it("throws PARSE_FAILED when graph.json is malformed JSON", async () => {
      setupMocks({ graphJSON: "{invalid json" })
      await expect(adapter.open()).rejects.toThrow(FSError)
      await expect(adapter.open()).rejects.toMatchObject({ code: "PARSE_FAILED" })
    })

    it("throws VALIDATION_FAILED when graph.json has wrong shape", async () => {
      setupMocks({ graphJSON: JSON.stringify({ version: 5, entities: "not-array", relations: [] }) })
      await expect(adapter.open()).rejects.toThrow(FSError)
      await expect(adapter.open()).rejects.toMatchObject({ code: "VALIDATION_FAILED" })
    })

    it("throws VERSION_TOO_NEW when version > 5", async () => {
      setupMocks({ graphJSON: JSON.stringify({ version: 6, entities: [], relations: [] }) })
      await expect(adapter.open()).rejects.toThrow(FSError)
      await expect(adapter.open()).rejects.toMatchObject({ code: "VERSION_TOO_NEW" })
    })

    it("throws PERMISSION_DENIED when picker throws security error", async () => {
      setupMocks({ pickerError: "SecurityError" })
      await expect(adapter.open()).rejects.toThrow(FSError)
      await expect(adapter.open()).rejects.toMatchObject({ code: "PERMISSION_DENIED" })
    })
  })

  describe("save()", () => {
    it("writes snapshot to graph.json when folder is open", async () => {
      const mocks = setupMocks()
      await adapter.open()
      const snapshot = validSnapshot()
      await adapter.save(snapshot)
      expect(mocks.writable.write).toHaveBeenCalled()
      expect(mocks.writable.close).toHaveBeenCalled()
    })

    it("throws NO_FOLDER_OPEN when no folder is open", async () => {
      await expect(adapter.save(validSnapshot())).rejects.toThrow(FSError)
      await expect(adapter.save(validSnapshot())).rejects.toMatchObject({ code: "NO_FOLDER_OPEN" })
    })

    it("throws WRITE_FAILED when write fails", async () => {
      setupMocks({ writableError: "disk full" })
      await adapter.open()
      await expect(adapter.save(validSnapshot())).rejects.toThrow(FSError)
      await expect(adapter.save(validSnapshot())).rejects.toMatchObject({ code: "WRITE_FAILED" })
    })

    it("aborts writable on write failure", async () => {
      const mocks = setupMocks({ writableError: "disk full" })
      await adapter.open()
      try {
        await adapter.save(validSnapshot())
      } catch {
        expect(mocks.writable.abort).toHaveBeenCalled()
      }
    })
  })

  describe("close()", () => {
    it("clears handle, folderName, status, and log", async () => {
      setupMocks()
      await adapter.open()
      expect(adapter.isOpen()).toBe(true)

      adapter.close()
      expect(adapter.isOpen()).toBe(false)
      expect(adapter.getFolderName()).toBeNull()
      expect(adapter.getStatus()).toBe("idle")
      expect(adapter.getLog()).toEqual([])
    })
  })

  describe("operation log", () => {
    it("records open operation on success", async () => {
      setupMocks()
      await adapter.open()
      const log = adapter.getLog()
      const openEntry = log.find((e) => e.operation === "open")
      expect(openEntry).toBeDefined()
      expect(openEntry!.success).toBe(true)
      expect(openEntry!.meta?.entityCount).toBe(2)
    })

    it("records validate operation", async () => {
      setupMocks()
      await adapter.open()
      const log = adapter.getLog()
      const validateEntry = log.find((e) => e.operation === "validate")
      expect(validateEntry).toBeDefined()
      expect(validateEntry!.success).toBe(true)
    })

    it("records save operation on success", async () => {
      setupMocks()
      await adapter.open()
      await adapter.save(validSnapshot())
      const log = adapter.getLog()
      const saveEntry = log.find((e) => e.operation === "save")
      expect(saveEntry).toBeDefined()
      expect(saveEntry!.success).toBe(true)
      expect(saveEntry!.meta?.entityCount).toBe(2)
    })

    it("records save operation on failure", async () => {
      await expect(adapter.save(validSnapshot())).rejects.toThrow()
      const log = adapter.getLog()
      const saveEntry = log.find((e) => e.operation === "save")
      expect(saveEntry).toBeDefined()
      expect(saveEntry!.success).toBe(false)
      expect(saveEntry!.error?.code).toBe("NO_FOLDER_OPEN")
    })

    it("records close operation", async () => {
      setupMocks()
      await adapter.open()
      adapter.close()
      const log = adapter.getLog()
      expect(log).toHaveLength(0) // close clears the log
    })

    it("records open with not_found reason when graph.json missing", async () => {
      setupMocks({ graphJSON: null })
      const result = await adapter.open()
      expect(result).toBeNull()
      const log = adapter.getLog()
      const openEntry = log.find((e) => e.operation === "open")
      expect(openEntry).toBeDefined()
      expect(openEntry!.success).toBe(true)
      expect(openEntry!.meta?.reason).toBe("not_found")
    })

    it("records open failure with error details when read fails", async () => {
      setupMocks({ readError: "permission denied" })
      await expect(adapter.open()).rejects.toThrow(FSError)
      const log = adapter.getLog()
      const openEntry = log.find((e) => e.operation === "open")
      expect(openEntry).toBeDefined()
      expect(openEntry!.success).toBe(false)
      expect(openEntry!.error?.code).toBe("WRITE_FAILED")
    })

    it("limits log to 100 entries", async () => {
      setupMocks()
      await adapter.open()
      // Manually add entries past the limit
      for (let i = 0; i < 150; i++) {
        adapter.save(validSnapshot()).catch(() => {})
      }
      const log = adapter.getLog()
      expect(log.length).toBeLessThanOrEqual(100)
    })

    it("returns a copy of the log (immutable)", () => {
      setupMocks()
      const log1 = adapter.getLog()
      const log2 = adapter.getLog()
      expect(log1).toEqual(log2)
      // Modifying the returned array should not affect internal state
      log1.push({} as FSLogEntry)
      expect(adapter.getLog()).not.toEqual(log1)
    })
  })

  describe("lifecycle", () => {
    it("supports open → save → close → open cycle", async () => {
      setupMocks()
      const result1 = await adapter.open()
      expect(result1).not.toBeNull()
      expect(adapter.isOpen()).toBe(true)

      await adapter.save(validSnapshot())
      expect(adapter.isOpen()).toBe(true)

      adapter.close()
      expect(adapter.isOpen()).toBe(false)

      // Re-open requires a new mock setup
      setupMocks({ graphJSON: JSON.stringify(validSnapshot()) })
      const result2 = await adapter.open()
      expect(result2).not.toBeNull()
      expect(adapter.isOpen()).toBe(true)
    })
  })
})
