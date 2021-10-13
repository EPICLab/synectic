import { useCallback, useEffect, useState } from 'react';
import { PathLike } from 'fs-extra';
import * as io from '../io';
import { useAppDispatch } from '../../store/hooks';
import { getMetafile, isMetafilePathed, MetafileWithPath } from '../metafiles';
import useGitWatcher from './useGitWatcher';
import { WatchEventType } from './useWatcher';

export type useDirectoryHook = {
    root: PathLike,
    directories: MetafileWithPath[],
    files: MetafileWithPath[],
    update: () => Promise<void>
}

const useDirectory = (root: PathLike): useDirectoryHook => {
    const dispatch = useAppDispatch();
    const [directories, setDirectories] = useState<MetafileWithPath[]>([]);
    const [files, setFiles] = useState<MetafileWithPath[]>([]);
    const eventHandler = async (event: WatchEventType) => ['add', 'addDir', 'change', 'unlink', 'unlinkDir'].includes(event) ? update() : null;
    useGitWatcher(root, eventHandler);

    const update = useCallback(async () => {
        const filepaths = (await io.readDirAsyncDepth(root, 1)).filter(p => p !== root); // filter root filepath from results
        const metafiles = await Promise.all(filepaths.map(async f => await dispatch(getMetafile({ filepath: f })).unwrap()));

        const directoryMetafiles = metafiles.filter(isMetafilePathed).filter(m => 'filetype' in m && m.filetype === 'Directory');
        const fileMetafiles = metafiles
            .filter(isMetafilePathed)
            .filter(m => 'filetype' in m && 'handler' in m)
            .filter(m => m.filetype !== 'Directory' && m.handler !== 'Diff');

        setDirectories(directoryMetafiles);
        setFiles(fileMetafiles);
    }, [root]);

    useEffect(() => { update() }, []);

    return { root, directories, files, update };
}

export default useDirectory;