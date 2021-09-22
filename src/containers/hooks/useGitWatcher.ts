import { PathLike } from 'fs-extra';
import { useAppDispatch } from '../../store/hooks';
import { getStatus } from '../git-porcelain';
import { metafileUpdated } from '../../store/slices/metafiles';
import { getMetafile } from '../metafiles';
import useWatcher, { WatchEventType, WatchListener } from './useWatcher';

/**
 * Custom React Hook for monitoring Git repository files and triggering Redux updates on metafiles
 * when changes are detected. If a target path is not under version control, then updates will only
 * reflect changes in the file stats and content (i.e. `containers/git-porcelain.getStatus` will return
 * undefined on non-versioned filepaths). Uses `useWatcher` hooks under the hood for opening and closing
 * FS watchers, which drive subsequent status checks, based on the context closure of the component
 * calling this hook.
 * @param root The Git root repository (i.e. the path returned by `containers/git-porcelain.getRepoRoot`)
 * @param additionalEventHandler An optional additional event handler for bubbling up specific events from
 * the underlying `useWatcher` hooks.
 */
const useGitWatcher = (root: PathLike, additionalEventHandler?: WatchListener<PathLike>): void => {
    const dispatch = useAppDispatch();

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        console.log(`useGitDirectory eventHandler: '${event}' for '${filename.toString()}'`)
        if (!['unlink', 'unlinkDir'].includes(event)) {
            const status = await getStatus(filename);
            if (status) {
                const metafile = await dispatch(getMetafile({ filepath: filename })).unwrap();
                if (metafile) dispatch(metafileUpdated(metafile));
            }
        }
    }

    useWatcher(root, eventHandler);
    if (additionalEventHandler) useWatcher(root, additionalEventHandler);
}

export default useGitWatcher;