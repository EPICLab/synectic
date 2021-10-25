import { useCallback, useEffect, useState } from 'react';
import { PathLike } from 'fs-extra';
import * as io from '../io';
import { useAppDispatch } from '../../store/hooks';
import { getMetafile, isMetafilePathed, MetafileWithPath } from '../metafiles';
import useGitWatcher from './useGitWatcher';
import { WatchEventType } from './useWatcher';

export type useDirectoryHook = {
    root: PathLike | undefined,
    directories: MetafileWithPath[],
    files: MetafileWithPath[],
    update: () => Promise<void>
}

/**
 * Custom React Hook for monitoring directories and files for changes based on either Git repository updates or filesystem
 * updates being detected. Uses `useGitWatcher` hook under the hood for managing `useWatcher` hooks, which becomes a pass-through
 * operation when a root path is not under version control (and only file stats and content changes can be observed). Triggers 
 * Redux updates on metafiles when changes are detected.
 * @param root The relative or absolute path to the git root directory.
 * @returns A `useDirectoryHook` object containing the root path, metafiles separated into directory and file lists, and a `update` function 
 * for manually triggering updates. 
 */
const useDirectory = (root: PathLike | undefined): useDirectoryHook => {
    const dispatch = useAppDispatch();
    const [directories, setDirectories] = useState<MetafileWithPath[]>([]);
    const [files, setFiles] = useState<MetafileWithPath[]>([]);
    const eventHandler = async (event: WatchEventType) => ['add', 'addDir', 'change', 'unlink', 'unlinkDir'].includes(event) ? update() : null;
    useGitWatcher(root, eventHandler);

    const update = useCallback(async () => {
        if (root) {
            const filepaths = (await io.readDirAsyncDepth(root, 1)).filter(p => p !== root); // filter root filepath from results
            console.log(`useDirectory for ${root.toString()} [${filepaths.length}]: ${JSON.stringify(filepaths)}`);
            const metafiles = await Promise.all(filepaths.map(async f => await dispatch(getMetafile({ filepath: f })).unwrap()));

            const directoryMetafiles = metafiles.filter(isMetafilePathed).filter(m => 'filetype' in m && m.filetype === 'Directory');
            const fileMetafiles = metafiles
                .filter(isMetafilePathed)
                .filter(m => 'filetype' in m && 'handler' in m)
                .filter(m => m.filetype !== 'Directory' && m.handler !== 'Diff');

            setDirectories(directoryMetafiles);
            setFiles(fileMetafiles);
        }
    }, [root]);

    useEffect(() => { update() }, []);

    return { root, directories, files, update };
}

export default useDirectory;