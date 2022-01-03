import { useCallback, useEffect } from 'react';
import { PathLike } from 'fs-extra';
import { relative } from 'path';
import * as io from '../io';
import { useAppDispatch } from '../../store/hooks';
import useMap from './useMap';
import useGitWatcher from './useGitWatcher';
import { WatchEventType } from './useWatcher';
import { metafileUpdated } from '../../store/slices/metafiles';
import { DirectoryMetafile, fetchContains, fetchContent, fetchMetafile, fetchVersionControl, FileMetafile, isDirectoryMetafile, isFileMetafile } from '../../store/thunks/metafiles';
import { asyncFilter } from '../format';
import { getIgnore } from '../git-plumbing';

export type useDirectoryHook = {
    root: PathLike | undefined,
    directories: DirectoryMetafile[],
    files: FileMetafile[],
    update: () => Promise<void>
}

/**
 * Custom React Hook for monitoring directories and files for changes based on either Git repository updates or filesystem
 * updates being detected. Uses `useGitWatcher` hook under the hood for managing `useWatcher` hooks, which becomes a pass-through
 * operation when a root path is not under version control (and only file stats and content changes can be observed). Triggers 
 * Redux updates on metafiles when changes are detected.
 * @param root The relative or absolute path to the git root directory.
 * @returns A `useDirectoryHook` object containing the root path, metafiles separated into directory and file lists, and an `update` function 
 * for manually triggering updates. 
 */
const useDirectory = (root: PathLike | undefined): useDirectoryHook => {
    const dispatch = useAppDispatch();
    useGitWatcher(root, async (event: WatchEventType, filename: PathLike) => update(event, filename));
    const [directories, directoryActions] = useMap<string, DirectoryMetafile>([]);
    const [files, fileActions] = useMap<string, FileMetafile>([]);

    useEffect(() => { updateAll() }, []);

    const updateAll = useCallback(async () => {
        if (root) {
            const ignore = await getIgnore(root, true);
            const filepaths = (await io.readDirAsyncDepth(root, 1))
                .filter(p => p !== root)                                     // filter root filepath from results
                .filter(p => !p.includes('.git'))                            // filter git directory
                .filter(p => !ignore.ignores(relative(root.toString(), p))); // filter based on git-ignore rules
            const subdirs = await asyncFilter(filepaths, (f) => io.isDirectory(f));
            const subfiles = filepaths.filter(f => !subdirs.includes(f));
            await Promise.all(subdirs.map(f => update('addDir', f)));
            await Promise.all(subfiles.map(f => update('add', f)));
        }
    }, [root]);

    const update = async (event: WatchEventType, filename: PathLike) => {
        if (filename.toString().includes('.git')) {
            // handle git directory by checking all files
            updateAll();
            return;
        }
        switch (event) {
            case 'unlink': {
                fileActions.remove(filename.toString());
                break;
            }
            case 'unlinkDir': {
                const childpaths = (await io.readDirAsyncDepth(filename, 1)).filter(p => p !== filename);
                childpaths.map(f => {
                    fileActions.remove(f);      // remove any files, no-op on directories
                    directoryActions.remove(f); // remove any directories, no-op on files
                });
                directoryActions.remove(filename.toString());
                break;
            }
            case 'add': {
                const metafile = await dispatch(fetchMetafile({ filepath: filename })).unwrap();
                if (isFileMetafile(metafile)) fileActions.set(metafile.path.toString(), metafile);
                break;
            }
            case 'addDir': {
                const metafile = await dispatch(fetchMetafile({ filepath: filename })).unwrap();
                if (isDirectoryMetafile(metafile)) directoryActions.set(metafile.path.toString(), metafile);
                break;
            }
            case 'change': {
                const metafile = await dispatch(fetchMetafile({ filepath: filename })).unwrap();
                if (isDirectoryMetafile(metafile)) await updateDirectoryMetafile(metafile);
                if (isFileMetafile(metafile)) await updateFileMetafile(metafile);
                break;
            }
        }
    };

    const updateFileMetafile = async (metafile: FileMetafile) => {
        const contentAndState = await dispatch(fetchContent({ filepath: metafile.path })).unwrap();
        const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
        const updated = dispatch(metafileUpdated({ ...metafile, ...contentAndState, ...vcs })).payload;
        fileActions.set(metafile.path.toString(), updated as FileMetafile);
    }

    const updateDirectoryMetafile = async (metafile: DirectoryMetafile) => {
        const containsAndState = await dispatch(fetchContains(metafile.path)).unwrap();
        const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
        const updated = dispatch(metafileUpdated({ ...metafile, ...containsAndState, ...vcs })).payload;
        directoryActions.set(metafile.path.toString(), updated as DirectoryMetafile);
    }

    return { root, directories: Array.from(directories.values()), files: Array.from(files.values()), update: updateAll };
}

export default useDirectory;