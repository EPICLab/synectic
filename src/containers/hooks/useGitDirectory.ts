import { PathLike } from 'fs-extra';
import useFSWatcher from './useFSWatcher';
import { useAppDispatch } from '../../store/hooks';
import { getStatus } from '../git-porcelain';
import { metafileUpdated } from '../../store/slices/metafiles';
import { getMetafile } from '../metafiles';
import { useCallback, useState } from 'react';

const useGitDirectory = (root: PathLike): void => {
    const dispatch = useAppDispatch();
    useState(useFSWatcher(root, (_, filename) => update(filename)));
    // useFSWatcher(root, (_, filename) => asyncUpdate(filename));
    console.log(`setting up useGitDirectory for ${root.toString()}`);

    const update = useCallback(async (filename: PathLike) => {
        console.log(`asyncUpdate firing for ${filename.toString()}`);
        const status = await getStatus(filename);
        if (status) {
            const metafile = await dispatch(getMetafile({ filepath: filename })).unwrap();
            if (metafile) dispatch(metafileUpdated(metafile));
        }
    }, [dispatch]);
}

export default useGitDirectory;