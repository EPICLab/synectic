import { PathLike } from 'fs-extra';
import { useAppDispatch } from '../../store/hooks';
import { getStatus } from '../git-porcelain';
import { metafileUpdated } from '../../store/slices/metafiles';
import { getMetafile } from '../metafiles';
import useWatcher, { WatchEventType } from './useWatcher';

const useGitDirectory = (root: PathLike): void => {
    const dispatch = useAppDispatch();

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        if (!(event in ['unlink', 'unlinkDir'])) {
            const status = await getStatus(filename);
            if (status) {
                const metafile = await dispatch(getMetafile({ filepath: filename })).unwrap();
                if (metafile) dispatch(metafileUpdated(metafile));
            }
        }
    }

    useWatcher(root, eventHandler);
}

export default useGitDirectory;