import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { PathLike } from 'fs-extra'

import { RootState } from '../root'
import { Metafile } from '../../types'
import * as metafile from '../../containers/metafiles'
import { Action } from '../actions'

type useDirectoryHook = [
  { root: Metafile | undefined, directories: string[], files: string[] },
  { fetch: () => Promise<void> }
];

/**
 * Custom React Hook for managing the list of directories and files contained within a root directory existing in the filesystem.
 * The initial state of the hook is empty, and will only be populated upon a fetch. The fetch method is optimized to only call
 * filesystem-intensive functions when root has not been set (and no Metafile is supplied for initialRoot); the 
 * metafile.updateDirectoryContains() method is already optimized to skip updating Redux state if the contained paths are the 
 * same as the paths in the previous state (i.e. a React rerender only occurs when necessary to update contained files/directories).
 * @param initialRoot The root directory that all subsequent child files and directories derive from; can be Metafile or filepath.
 * @return A named set of state fields (root, directories, files) and a named action (fetch).
 */
const useDirectory = (initialRoot: Metafile | PathLike): useDirectoryHook => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const [root, setRoot] = useState<Metafile | undefined>();
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);

  // Type guard to verify and return a Metafile type predicate
  const isMetafile = (untypedRoot: unknown): untypedRoot is Metafile => (untypedRoot as Metafile).id ? true : false;

  const fetch = useCallback(async () => {
    // check if root is already set (and update contained files/directories if it is), otherwise examine whether initialRoot is already
    // a Metafile or needs to be acquired first (and updated in the Redux store in the process)
    if (root) {
      const existRoot: Metafile = metafile.getMetafile({ id: root.id });
    } else {
      const initRoot: Metafile = isMetafile(initialRoot) ? initialRoot : await dispatch(metafile.getMetafile({ filepath: initialRoot }));
    }
    const rootMetafile: Metafile = root ?
      (async () => {
        await dispatch(metafile.updateContents(root.id));
      }) : {};

    // const rootMetafile: Metafile = root ? (await dispatch(metafile.updateDirectoryContains(root as metafile.PathRequiredMetafile))) : (
    //   isMetafile(initialRoot) ? initialRoot : await dispatch(metafile.getMetafile(initialRoot)));

    if (rootMetafile.contains) {
      const filteredContains = await metafile.filterDirectoryContainsTypes(rootMetafile as metafile.ContainsRequiredMetafile, false);
      // verify that the root, directories, and files have changed before updating each of them
      if ((root && JSON.stringify(root) !== JSON.stringify(rootMetafile)) || !root) setRoot(rootMetafile);
      if (JSON.stringify(directories) !== JSON.stringify(filteredContains.directories)) setDirectories(filteredContains.directories);
      if (JSON.stringify(files) !== JSON.stringify(filteredContains.files)) setFiles(filteredContains.files);
    }
  }, [root, dispatch, initialRoot, directories, files]);

  return [{ root, directories, files }, { fetch }];
}

export default useDirectory;