interface FileSystemHandle {
  readonly name: string
  readonly kind: "file" | "directory"
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  queryPermission(descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>
  requestPermission(descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
}

interface Window {
  showDirectoryPicker(options?: FileSystemPickerOptions): Promise<FileSystemDirectoryHandle>
}

interface FileSystemPickerOptions {
  mode?: "read" | "readwrite"
}

interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
  abort(): Promise<void>
}
