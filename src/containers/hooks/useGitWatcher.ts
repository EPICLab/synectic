import { PathLike } from 'fs-extra';
import { useAppDispatch } from '../../store/hooks';
import { metafileUpdated } from '../../store/slices/metafiles';
import { fetchMetafilesByFilepath, fetchVersionControl } from '../../store/thunks/metafiles';
import useWatcher, { WatchEventType, WatchListener } from './useWatcher';

/**
 * Custom React Hook for monitoring Git repository files and triggering Redux updates on metafiles
 * when changes are detected. If a root path is not under version control, then updates will only
 * reflect changes in the file stats and content (i.e. `containers/git-porcelain.getStatus` will return
 * undefined on non-versioned filepaths). Uses `useWatcher` hooks under the hood for opening and closing
 * FS watchers, which drive subsequent status checks, based on the context closure of the component
 * calling this hook.
 * @param root The Git root repository (i.e. the path returned by `containers/git-path.getRoot`)
 * @param additionalEventHandler An optional additional event handler for bubbling up specific events from
 * the underlying `useWatcher` hooks.
 */
const useGitWatcher = (root: PathLike | undefined, additionalEventHandler?: WatchListener<PathLike>): void => {
    const dispatch = useAppDispatch();

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        if (!['unlink', 'unlinkDir'].includes(event)) {
            const metafiles = await dispatch(fetchMetafilesByFilepath(filename)).unwrap();
            await Promise.all(metafiles.map(async metafile => {
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                dispatch(metafileUpdated({ ...metafile, ...vcs }));
            }));
        }
    }

    if (root) useWatcher(root, eventHandler);
    if (root && additionalEventHandler) useWatcher(root, additionalEventHandler);
}

export default useGitWatcher;