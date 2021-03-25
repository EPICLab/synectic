import { useCallback, useState } from 'react';
import { PathLike } from 'fs-extra';

import * as io from '../../containers/io';
import { removeDuplicates } from '../../containers/format';

type useDirectoryHook = {
  root: PathLike,
  directories: PathLike[],
  files: PathLike[],
  update: () => Promise<void>
}

type DifferentiatedPaths = {
  directories: PathLike[];
  files: PathLike[];
}

/**
 * Custom React Hook for managing the list of directories and files contained within a root directory. The initial state of the 
 * hook is empty, and will only be populated after update has been called. The update method is optimized to only alter the
 * `directories` and `files` states when they no longer match the filesystem. This should alleviate any unnecessary rerendering
 * for components that use this hook.
 * @param root The root directory that all subsequent child files and directories derive from.
 * @return The states of `root`, `directories`, `files`, and the asynchronous `update` function.
 */
export const useDirectory = (root: PathLike): useDirectoryHook => {
  const [directories, setDirectories] = useState<PathLike[]>([]);
  const [files, setFiles] = useState<PathLike[]>([]);

  // splits filepaths into directory and file lists
  const filterPaths = async (filepaths: PathLike[]): Promise<DifferentiatedPaths> => {
    return await filepaths.reduce(async (previousPromise: Promise<DifferentiatedPaths>, filepath: PathLike) => {
      const collection = await previousPromise;
      const directory = await io.isDirectory(filepath);
      if (directory) collection.directories.push(filepath);
      else collection.files.push(filepath);
      return collection;
    }, Promise.resolve({ directories: [], files: [] }));
  };

  // compare two list of filepaths to determine whether there are deviations between them
  const isChanged = (a: PathLike[], b: PathLike[]): boolean => {
    const uniques = removeDuplicates<PathLike>([...a, ...b], (a: PathLike, b: PathLike) => a.toString() === b.toString());
    return uniques.length > 0;
  }

  // read child paths of root directory and update if any changes are found
  const update = useCallback(async () => {
    const filepaths = (await io.readDirAsyncDepth(root, 1)).filter(p => p !== root); // filter root filepath from results
    const differentiated = await filterPaths(filepaths);
    // // only update if changes are detected between the previous state and the new results
    if (isChanged(directories, differentiated.directories)) setDirectories(differentiated.directories);
    if (isChanged(files, differentiated.files)) setFiles(differentiated.files);
  }, [directories, files, root]);

  return { root, directories, files, update };
}
