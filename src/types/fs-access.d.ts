interface FileSystemDirectoryHandle {
  queryPermission(descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>
  requestPermission(descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>
}

interface Window {
  showDirectoryPicker(options?: FileSystemPickerOptions): Promise<FileSystemDirectoryHandle>
}

interface FileSystemPickerOptions {
  mode?: "read" | "readwrite"
}

interface FileSystemFileHandle {
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
