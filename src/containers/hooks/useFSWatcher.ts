import { useEffect, useRef } from 'react';
import { FSWatcher, PathLike, watch, WatchListener, WatchOptions } from 'fs-extra';
import { isDirectory, readDirAsyncDepth } from '../io';

/**
 * Custom React Hook for managing change/rename events on filesystem objects (directories and files) by using
 * Node.js File System module, see ref: https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener
 * @param filename The relative or absolute path to the a file or directory existing in the underlying filesystem.
 * @param handler The listener callback that receives `change` or `rename` events fired by `FS.FSWatcher`.
 * @param options Optional. If `options` is provided as a string, it specifies the `encoding`. Otherwise `options`
 * should be passed as an object.
 */
const useFSWatcher = (filename: PathLike, handler: WatchListener<PathLike>, options?: WatchOptions): void => {
    // Create a ref that stores handler, and ref to prevent race conditions in async requests
    const savedHandler = useRef<WatchListener<PathLike>>();
    const active = useRef<boolean>(true);

    useEffect(() => {
        const watchers = new Map<string, FSWatcher>();
        const fetchWatchers = async () => {
            // Update saved handler if necessary
            if (savedHandler.current !== handler) {
                savedHandler.current = handler;
            }

            if (active) {
                // Create watchers for all subfiles and directories if necessary
                const isDir = await isDirectory(filename);
                if (isDir) {
                    const subpaths = await readDirAsyncDepth(filename);
                    for (const subpath of subpaths) {
                        watchers.set(subpath, watch(filename, options, savedHandler?.current));
                    }
                } else {
                    watchers.set(filename.toString(), watch(filename, options, savedHandler?.current));
                }
            }
        }

        fetchWatchers();
        // Remove event listener on cleanup
        return () => {
            active.current = false;
            watchers.forEach(watcher => watcher.close());
        }
    }, [filename, handler, options])
}

export default useFSWatcher;