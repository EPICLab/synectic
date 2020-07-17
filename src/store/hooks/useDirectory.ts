import { useCallback, useState } from 'react'
import { Metafile } from '../../types'
import { useDispatch } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { RootState } from '../root'
import { AnyAction } from 'redux'
import { getMetafile, filterDirectoryContainsTypes, updateDirectoryContains, ContainsRequiredMetafile, PathRequiredMetafile } from '../../containers/metafiles'
import { PathLike } from 'fs-extra'

type useDirectoryHook = [
  { root: Metafile | undefined, directories: string[], files: string[] },
  { fetch: () => Promise<void> }
];

/**
 * Custom React Hook for managing the list of directories and files contained within a root directory that exists within the filesystem.
 * The initial state is of the hook is empty, and will only be populated upon a fetch. The fetch method is optimized to only call
 * filesystem-intensive functions when root has not been set (and no Metafile is supplied for initialRoot); the updateDirectoryContains()
 * method is already optimized to forgo updating Redux state if the contained paths are the same as the previous state (i.e. do not cause
 * a React rerender unless necessary).
 * @param initialRoot The root directory that all subsequent child files and directories derive from; can be Metafile or filepath.
 * @return A named set of state fields (root, directories, files) and a named action (fetch).
 */
const useDirectory = (initialRoot: Metafile | PathLike): useDirectoryHook => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
  const [root, setRoot] = useState<Metafile | undefined>();
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);

  const isMetafile = (untypedRoot: unknown): untypedRoot is Metafile => {
    if ((untypedRoot as Metafile).id) return true;
    return false;
  };

  const fetch = useCallback(async () => {
    // first check if root has previously been set (and if true just update contains), then differentiate dealing with Metafile or PathLike parameters
    const rootMetafile = root ? (await dispatch(updateDirectoryContains(root as PathRequiredMetafile))) : (
      isMetafile(initialRoot) ? initialRoot : await dispatch(getMetafile(initialRoot)));

    if (rootMetafile.contains) {
      const filteredContains = await filterDirectoryContainsTypes(rootMetafile as ContainsRequiredMetafile, false);
      // verify that the root, directories, and files have changed before updating each of them
      if ((root && JSON.stringify(root) !== JSON.stringify(rootMetafile)) || !root) setRoot(rootMetafile);
      if (JSON.stringify(directories) !== JSON.stringify(filteredContains.directories)) setDirectories(filteredContains.directories);
      if (JSON.stringify(files) !== JSON.stringify(filteredContains.files)) setFiles(filteredContains.files);
    }
  }, [directories, dispatch, files, initialRoot, root]);

  return [{ root, directories, files }, { fetch }];
}

export default useDirectory;