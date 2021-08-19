import { useCallback, useState } from 'react';
import { PathLike } from 'fs-extra';

import * as io from '../io';
import { removeDuplicates } from '../format';
import { getRepoRoot } from '../git-porcelain';
import { statusMatrix } from '../git-plumbing';
import { join } from 'path';

export type FileState = 'added' | 'deleted' | 'modified' | 'unmodified' | undefined;
export type MatrixStatus = [0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3];
export type HookEntry = {
  /** Absolute path to specific file or directory. */
  path: PathLike,
  /** Set of numerical status indicators for HEAD, WORKDIR, and STAGE trees. */
  status?: MatrixStatus,
  /** Git status for the path, relative to the filesystem. */
  fileState?: FileState
}

type useDirectoryHook = {
  root: PathLike,
  directories: HookEntry[],
  files: HookEntry[],
  update: () => Promise<void>
}
type FilteredPaths = { directories: HookEntry[], files: HookEntry[] }

// splits filepaths into directory and file entry lists
const filterPaths = async (filepaths: PathLike[]): Promise<FilteredPaths> => {
  return await filepaths.reduce(async (previousPromise: Promise<FilteredPaths>, filepath: PathLike) => {
    const collection = await previousPromise;
    const isDirectory = await io.isDirectory(filepath);
    if (isDirectory) collection.directories.push({ path: filepath });
    else collection.files.push({ path: filepath });
    return collection;
  }, Promise.resolve({ directories: [], files: [] }));
};

// compare two list of filepaths to determine whether there are deviations between them
const hasPathChanges = (prev: HookEntry[], curr: HookEntry[]): boolean => {
  const uniques = removeDuplicates<PathLike>(
    [...prev.map(p => p.path), ...curr.map(c => c.path)],
    (p: PathLike, c: PathLike) => p.toString() === c.toString()
  );
  return uniques.length > 0;
};

// compare previous entry status with latest status matrix results; returns updated entries only if git status has changed
const getStatusChanges = async (prev: HookEntry[], root: PathLike): Promise<HookEntry[] | undefined> => {
  const statuses = await statusMatrix(root);
  if (!statuses) return undefined;

  const prevMap = new Map<string, HookEntry>(prev.map(e => [e.path.toString(), e]));
  const fileStateFilter = (status: [number, number, number]) => {
    if (status[0] === 0) return 'added';
    if (status[0] === 1 && status[1] === 2) return 'modified';
    if (status[0] === 1 && status[1] === 0) return 'deleted';
    return 'unmodified';
  }

  let changed = false;
  const updatedEntries: HookEntry[] = statuses.map(row => {
    const prevEntry = prevMap.get(row[0]);
    const prevStatus = prevEntry ? prevEntry.status : undefined;
    if (!prevStatus) changed = true; // file didn't previously exist in git, so it must have changed
    else if (
      prevStatus[0] !== row[1] ||   // HEAD status
      prevStatus[1] !== row[2] ||   // WORKDIR status
      prevStatus[2] !== row[3]      // STAGE status
    ) {
      changed = true;
    }
    const statusRow: MatrixStatus = [row[1], row[2], row[3]];
    return { path: join(root.toString(), row[0]), status: statusRow, fileState: fileStateFilter(statusRow) };
  });

  return changed ? updatedEntries : undefined;
};

/**
 * Custom React Hook for managing the list of directories and files contained within a root directory. The initial state of the hook is 
 * empty, and will only be populated after `update` has been called. The `update` function is git-aware and optimized to only alter 
 * `directories` and `files` states when they no longer match the state of the git repository; or when used on a directory that is not
 * under version control it will revert to matching against the filesystem. This should alleviate any unnecessary rerendering for 
 * components that rely on this hook for renderable state.
 * @param root The root directory that all subsequent child files and directories derive from.
 * @return The states of `root`, `directories`, `files`, and the asynchronous `update` function.
 */
export const useDirectory = (root: PathLike): useDirectoryHook => {
  const [directories, setDirectories] = useState<HookEntry[]>([]);
  const [files, setFiles] = useState<HookEntry[]>([]);

  // read child paths of root directory and update if any changes are found
  const update = useCallback(async () => {
    const dir = await getRepoRoot(root);
    if (dir) {
      const updatedFiles = await getStatusChanges(files, root);
      if (updatedFiles) console.log('updating git-tracked files', { updatedFiles });
      if (updatedFiles) setFiles(updatedFiles);
    } else {
      const filepaths = (await io.readDirAsyncDepth(root, 1)).filter(p => p !== root); // filter root filepath from results
      const currPaths = await filterPaths(filepaths);
      // only update if changes are detected between the previous state and the new results
      if (hasPathChanges(directories, currPaths.directories)) {
        setDirectories(currPaths.directories);
      }
      if (hasPathChanges(files, currPaths.files)) {
        setFiles(currPaths.files);
      }
    }

  }, [directories, files, root]);

  return { root, directories, files, update };
}
