import type { Entity, Relation, CanvasState, GraphSnapshot } from "../../types/graph"

const APP_VERSION = 5
const MAX_LOG_ENTRIES = 100

export type FSErrorCode =
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "PARSE_FAILED"
  | "VALIDATION_FAILED"
  | "VERSION_TOO_NEW"
  | "WRITE_FAILED"
  | "NO_FOLDER_OPEN"
  | "USER_CANCELLED"

export class FSError extends Error {
  readonly code: FSErrorCode
  readonly detail: string

  constructor(code: FSErrorCode, detail: string) {
    super(`[${code}] ${detail}`)
    this.name = "FSError"
    this.code = code
    this.detail = detail
  }
}

export type FSLogEntry = {
  operation: "open" | "save" | "close" | "validate"
  timestamp: number
  success: boolean
  error?: { code: FSErrorCode; detail: string }
  meta?: Record<string, unknown>
}

export type FSAdapterStatus = "idle" | "open" | "error"

/**
 * Validates that `data` is a well-formed GraphSnapshot for the current app version.
 * Throws FSError(VALIDATION_FAILED) with a specific detail string on failure.
 * Returns the validated GraphSnapshot on success.
 */
export function validateSnapshot(data: unknown): GraphSnapshot {
  if (data === null || data === undefined) {
    throw new FSError("VALIDATION_FAILED", "data is null or undefined")
  }
  if (typeof data !== "object") {
    throw new FSError("VALIDATION_FAILED", `expected object, got ${typeof data}`)
  }
  if (Array.isArray(data)) {
    throw new FSError("VALIDATION_FAILED", "expected object, got array")
  }

  const d = data as Record<string, unknown>

  if (typeof d.version !== "number") {
    throw new FSError("VALIDATION_FAILED", `version is not a number: ${typeof d.version}`)
  }
  if (d.version > APP_VERSION) {
    throw new FSError("VERSION_TOO_NEW", `file version ${d.version} is newer than supported version ${APP_VERSION}`)
  }

  if (!Array.isArray(d.entities)) {
    throw new FSError("VALIDATION_FAILED", "entities is not an array")
  }
  if (!Array.isArray(d.relations)) {
    throw new FSError("VALIDATION_FAILED", "relations is not an array")
  }

  for (let i = 0; i < d.entities.length; i++) {
    const e = d.entities[i] as Record<string, unknown> | undefined
    if (!e || typeof e !== "object") {
      throw new FSError("VALIDATION_FAILED", `entities[${i}] is not an object`)
    }
    if (typeof e.id !== "string") {
      throw new FSError("VALIDATION_FAILED", `entities[${i}].id is not a string`)
    }
    if (typeof e.type !== "string") {
      throw new FSError("VALIDATION_FAILED", `entities[${i}].type is not a string`)
    }
    if (typeof e.content !== "string") {
      throw new FSError("VALIDATION_FAILED", `entities[${i}].content is not a string`)
    }
    if (!e.metadata || typeof e.metadata !== "object" || Array.isArray(e.metadata)) {
      throw new FSError("VALIDATION_FAILED", `entities[${i}].metadata is not an object`)
    }
    if (!e.canvasData || typeof e.canvasData !== "object" || Array.isArray(e.canvasData)) {
      throw new FSError("VALIDATION_FAILED", `entities[${i}].canvasData is not an object`)
    }
  }

  for (let i = 0; i < d.relations.length; i++) {
    const r = d.relations[i] as Record<string, unknown> | undefined
    if (!r || typeof r !== "object") {
      throw new FSError("VALIDATION_FAILED", `relations[${i}] is not an object`)
    }
    if (typeof r.id !== "string") {
      throw new FSError("VALIDATION_FAILED", `relations[${i}].id is not a string`)
    }
    if (typeof r.source !== "string") {
      throw new FSError("VALIDATION_FAILED", `relations[${i}].source is not a string`)
    }
    if (typeof r.target !== "string") {
      throw new FSError("VALIDATION_FAILED", `relations[${i}].target is not a string`)
    }
    if (typeof r.type !== "string") {
      throw new FSError("VALIDATION_FAILED", `relations[${i}].type is not a string`)
    }
    if (typeof r.sortOrder !== "string") {
      throw new FSError("VALIDATION_FAILED", `relations[${i}].sortOrder is not a string`)
    }
  }

  const canvas = d.canvas
  if (canvas !== undefined) {
    if (typeof canvas !== "object" || canvas === null || Array.isArray(canvas)) {
      throw new FSError("VALIDATION_FAILED", "canvas is not an object")
    }
  }

  return {
    version: d.version as 5,
    entities: d.entities as Entity[],
    relations: d.relations as Relation[],
    canvas: (canvas ?? {}) as CanvasState,
  }
}

/**
 * Standalone File System Access adapter for explicit open/save/close operations.
 *
 * This adapter is NOT a PersistenceAdapter — it does not auto-save, auto-reconnect,
 * or act as a runtime persistence backend. IndexedDB is always the runtime store.
 * FS operations are invoked only by explicit user action.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export class FSAdapter {
  private _dirHandle: FileSystemDirectoryHandle | null = null
  private _dirName: string | null = null
  private _status: FSAdapterStatus = "idle"
  private _log: FSLogEntry[] = []

  private _logEntry(
    operation: FSLogEntry["operation"],
    success: boolean,
    meta?: Record<string, unknown>,
    error?: { code: FSErrorCode; detail: string },
  ): void {
    this._log.push({
      operation,
      timestamp: Date.now(),
      success,
      error,
      meta,
    })
    if (this._log.length > MAX_LOG_ENTRIES) {
      this._log = this._log.slice(-MAX_LOG_ENTRIES)
    }
  }

  /**
   * Open a folder picker, read and validate graph.json.
   *
   * @returns The validated GraphSnapshot, or null if the user cancelled the picker
   *   or the folder does not contain graph.json (isOpen() will be true in the latter case).
   * @throws {FSError} PARSE_FAILED if JSON is malformed, VALIDATION_FAILED if shape is wrong,
   *   VERSION_TOO_NEW if version exceeds supported, PERMISSION_DENIED if folder access is denied.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
   */
  async open(): Promise<GraphSnapshot | null> {
    let handle: FileSystemDirectoryHandle
    try {
      handle = await window.showDirectoryPicker({ mode: "readwrite" })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        this._logEntry("open", true, { reason: "cancelled" })
        return null
      }
      const code: FSErrorCode = err instanceof DOMException && err.name === "SecurityError"
        ? "PERMISSION_DENIED"
        : "PERMISSION_DENIED"
      const detail = err instanceof Error ? err.message : String(err)
      this._logEntry("open", false, undefined, { code, detail })
      throw new FSError(code, detail)
    }

    this._dirHandle = handle
    this._dirName = handle.name
    this._status = "open"

    let fileHandle: FileSystemFileHandle
    try {
      fileHandle = await handle.getFileHandle("graph.json")
    } catch {
      this._logEntry("open", true, { reason: "not_found", folderName: handle.name })
      return null
    }

    let text: string
    try {
      const file = await fileHandle.getFile()
      text = await file.text()
    } catch (err) {
      const detail = `failed to read graph.json: ${err instanceof Error ? err.message : String(err)}`
      this._logEntry("open", false, undefined, { code: "WRITE_FAILED", detail })
      throw new FSError("WRITE_FAILED", detail)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      const detail = `graph.json is not valid JSON: ${err instanceof Error ? err.message : String(err)}`
      this._logEntry("open", false, { folderName: handle.name }, { code: "PARSE_FAILED", detail })
      throw new FSError("PARSE_FAILED", detail)
    }

    this._logEntry("validate", true, { folderName: handle.name })

    let snapshot: GraphSnapshot
    try {
      snapshot = validateSnapshot(parsed)
    } catch (err) {
      if (err instanceof FSError) {
        this._logEntry("open", false, { folderName: handle.name }, { code: err.code, detail: err.detail })
        throw err
      }
      throw err
    }

    this._logEntry("open", true, { entityCount: snapshot.entities.length, folderName: handle.name })
    return snapshot
  }

  /**
   * Write the current snapshot to graph.json in the open folder.
   *
   * @throws {FSError} NO_FOLDER_OPEN if no folder is currently open,
   *   WRITE_FAILED if the file write fails.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable
   */
  async save(snapshot: GraphSnapshot): Promise<void> {
    if (!this._dirHandle) {
      const detail = "no folder is currently open"
      this._logEntry("save", false, undefined, { code: "NO_FOLDER_OPEN", detail })
      throw new FSError("NO_FOLDER_OPEN", detail)
    }

    let fileHandle: FileSystemFileHandle
    try {
      fileHandle = await this._dirHandle.getFileHandle("graph.json", { create: true })
    } catch (err) {
      const code: FSErrorCode = err instanceof DOMException && err.name === "SecurityError"
        ? "PERMISSION_DENIED"
        : "WRITE_FAILED"
      const detail = err instanceof Error ? err.message : String(err)
      this._logEntry("save", false, undefined, { code, detail })
      throw new FSError(code, detail)
    }

    let writable: FileSystemWritableFileStream
    try {
      writable = await fileHandle.createWritable()
    } catch (err) {
      const code: FSErrorCode = err instanceof DOMException && err.name === "SecurityError"
        ? "PERMISSION_DENIED"
        : "WRITE_FAILED"
      const detail = err instanceof Error ? err.message : String(err)
      this._logEntry("save", false, undefined, { code, detail })
      throw new FSError(code, detail)
    }

    try {
      await writable.write(JSON.stringify(snapshot, null, 2))
      await writable.close()
    } catch (err) {
      await writable.abort().catch(() => {})
      const code: FSErrorCode = err instanceof DOMException && err.name === "SecurityError"
        ? "PERMISSION_DENIED"
        : "WRITE_FAILED"
      const detail = err instanceof Error ? err.message : String(err)
      this._logEntry("save", false, undefined, { code, detail })
      throw new FSError(code, detail)
    }

    this._logEntry("save", true, { entityCount: snapshot.entities.length })
  }

  /**
   * Close the open folder and clear the handle.
   * The operation log is cleared on close.
   */
  close(): void {
    this._dirHandle = null
    this._dirName = null
    this._status = "idle"
    this._log = []
  }

  /** True if a folder is currently open (handle stored). */
  isOpen(): boolean {
    return this._dirHandle !== null
  }

  /** Name of the open folder, or null. */
  getFolderName(): string | null {
    return this._dirName
  }

  /** Returns the raw directory handle if a folder is open, or null. */
  getRootHandle(): FileSystemDirectoryHandle | null {
    return this._dirHandle
  }

  /** Current status of the adapter. */
  getStatus(): FSAdapterStatus {
    return this._status
  }

  /** Returns a copy of the operation log. */
  getLog(): FSLogEntry[] {
    return [...this._log]
  }
}
