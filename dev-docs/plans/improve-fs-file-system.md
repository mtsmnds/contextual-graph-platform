

we have multiple problems in implementing filesystem access and the implementation fails silently. 
we'll move to the npm package `browser-fs-access` wrapped in a zustand store.

the new implementation should be verbose, exposing statuses to the user instead of failing or succeding silently. 

## install `browser-fs-access`

```bash
npm install browser-fs-access
```

## zustand store
create a dedicated file store (src/stores/useFileStore.ts). This structure explicitly handles loading and errors so nothing can fail silently:

```typescript
import { create } from 'zustand';
import { directoryOpen, fileSave } from 'browser-fs-access';

interface GraphData {
  nodes: any[];
  edges: any[];
}

interface FileStoreState {
  dirHandle: any | null;                 // Keeps track of the opened folder
  graphFiles: string[];                  // List of found JSON filenames
  currentGraph: GraphData | null;        // The currently loaded graph data
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  
  openProjectFolder: () => Promise<void>;
  loadGraphFile: (fileName: string) => Promise<void>;
  saveCurrentGraph: (fileName: string, data: GraphData) => Promise<void>;
}

export const useFileStore = create<FileStoreState>((set, get) => ({
  dirHandle: null,
  graphFiles: [],
  currentGraph: null,
  status: 'idle',
  error: null,

  // 1. Open a local folder and scan for JSON graphs
  openProjectFolder: async () => {
    set({ status: 'loading', error: null });
    try {
      // browser-fs-access normalizes this across Chrome, Safari, and Firefox
      const files = await directoryOpen({ recursive: false });
      
      // Filter out only your graph JSON files
      const jsonFiles = files
        .filter(file => file.name.endsWith('.json'))
        .map(file => file.name);

      set({ 
        dirHandle: files, // Storing the files array/handles safely
        graphFiles: jsonFiles,
        status: 'success' 
      });
    } catch (err: any) {
      // Catch user cancellation or permission blocks explicitly
      if (err.name === 'AbortError') {
        set({ status: 'idle' }); // User just changed their mind, not a real error
      } else {
        set({ status: 'error', error: err.message || 'Failed to open directory' });
      }
    }
  },

  // 2. Safely read and parse a specific JSON file
  loadGraphFile: async (fileName: string) => {
    const { dirHandle } = get();
    if (!dirHandle) return set({ status: 'error', error: 'No folder open' });

    set({ status: 'loading', error: null });
    try {
      // Find the specific file matching the name in our directory handle
      const fileBlob = dirHandle.find((f: any) => f.name === fileName);
      if (!fileBlob) throw new Error(`File ${fileName} not found`);

      const text = await fileBlob.text();
      const graphData = JSON.parse(text); // Might fail if corrupted

      set({ currentGraph: graphData, status: 'success' });
    } catch (err: any) {
      set({ status: 'error', error: `Load failed: ${err.message}` });
    }
  },

  // 3. Save graph back to disk safely
  saveCurrentGraph: async (fileName: string, data: GraphData) => {
    set({ status: 'loading', error: null });
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      // Save it directly back into the system
      await fileSave(blob, { fileName });
      
      set({ currentGraph: data, status: 'success' });
    } catch (err: any) {
      set({ status: 'error', error: `Save failed: ${err.message}` });
    }
  }
}));
```


## use it anywhere
Now that the logic is centralized, componentizing becomes effortless. Any component in your app can connect to this file layer without knowing how the underlying file system works.

```tsx
import { useFileStore } from './stores/useFileStore';

export function ProjectManager() {
  const { graphFiles, status, error, openProjectFolder, loadGraphFile } = useFileStore();

  return (
    <div className="p-4 border rounded">
      <button onClick={openProjectFolder} className="btn-primary">
        Open Local Project Folder
      </button>

      {status === 'loading' && <p>Reading files...</p>}
      {status === 'error' && <p className="text-red-500">Error: {error}</p>}

      <ul className="mt-4">
        {graphFiles.map(fileName => (
          <li key={fileName}>
            <button onClick={() => loadGraphFile(fileName)} className="text-blue-500 underline">
              Load {fileName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```


## questions
is it worth considering `fs-extra` or `fs-jetpack`

## next
implement tauri's native fs plugin alongside the zustand store
- is it needed?
- requirement/dependency: tauri