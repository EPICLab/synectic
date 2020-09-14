import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { PathLike } from 'fs-extra'

import { RootState } from '../root'
import { Metafile } from '../../types'
import { Action } from '../actions'
import { getMetafile, filterDirectoryContainsTypes, ContainsRequiredMetafile } from '../../containers/metafiles'

type useDirectoryHook = {
  root: Metafile | undefined,
  directories: string[],
  files: string[],
  fetch: () => Promise<void>
};

/**
 * Custom React Hook for managing the list of directories and files contained within a root directory existing in the filesystem.
 * The initial state of the hook is empty, and will only be populated upon a fetch. The fetch method is optimized to only call
 * filesystem-intensive functions when root has not been set (and no Metafile is supplied for initialRoot); the 
 * metafile.updateContents() method is already optimized to skip updating Redux state if the contained paths are the same as the 
 * paths in the previous state (i.e. a React rerender only occurs when necessary to update contained files/directories).
 * @param initialRoot The root directory that all subsequent child files and directories derive from; can be Metafile or filepath.
 * @return The states of `root`, `directories`, `files`, and the `fetch` function.
 */
export const useDirectory = (initialRoot: Metafile | PathLike): useDirectoryHook => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const [root, setRoot] = useState<Metafile | undefined>();
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);

  // Type guard to verify and return a Metafile type predicate
  const isMetafile = (untypedRoot: unknown): untypedRoot is Metafile => (untypedRoot as Metafile).id ? true : false;

  const fetch = useCallback(async () => {
    /**
     * Calling `setState` on a React useState hook does not immediately update the state, and instead enqueues a re-render of
     * the component that will update state after the rerender. Therefore, we cannot use the `root` state directly on the same
     * tick as it is set (via `setRoot`) and have to carry `rootMetafile` between the steps in this callback.
     */
    let rootMetafile = root;

    if (!root) {
      // since not root exists, use `initialRoot` to get a metafile and update `root`
      rootMetafile = isMetafile(initialRoot) ? await dispatch(getMetafile({ id: initialRoot.id })) : await dispatch(getMetafile({ filepath: initialRoot }));
      setRoot(rootMetafile);
    }

    if (rootMetafile && rootMetafile.contains) {
      // update the `directories` and `files` states only if there are changes
      const updates = await filterDirectoryContainsTypes(rootMetafile as ContainsRequiredMetafile, false);
      if (JSON.stringify(directories) !== JSON.stringify(updates.directories)) setDirectories(updates.directories);
      if (JSON.stringify(files) !== JSON.stringify(updates.files)) setFiles(updates.files);
    }
  }, [root, dispatch, initialRoot, directories, files]);

  return { root, directories, files, fetch };
}
