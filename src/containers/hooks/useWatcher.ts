import { useEffect, useRef } from 'react';
import { PathLike } from 'fs-extra';
import { FSWatcher, WatchOptions, watch } from 'chokidar';

export type WatchEventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir' | 'ready' | 'raw' | 'error';
export type WatchListener<T> = (event: WatchEventType, filename: T) => void;

/**
 * Custom React Hook for monitoring filesystem objects (files and directories) and triggering an event callback
 * function when changes are detected. If a filepath is undefined, as in the case of virtual metafiles, then
 * this hook becomes a no-op and will skip opening any FS watchers; similarly if the event handler is undefined. 
 * This hook initializes FS watchers upon initialization, and will close all watchers based on the context 
 * closure of the calling component.
 * @param filepath The relative or absolute path to a file or directory (recursively includes all subdirectories 
 * and files) that should be watched for changes.
 * @param eventHandler The event callback function that should be called on all detected change events.
 * @param options Additional watcher options; see https://github.com/paulmillr/chokidar#api.
 */
const useWatcher = (filepath: PathLike | undefined, eventHandler: WatchListener<PathLike> | undefined, options?: WatchOptions): void => {
    // create a ref that caches the handler callback, and a ref to prevent race conditions on async requests
    const savedHandler = useRef<WatchListener<PathLike>>();
    const active = useRef(true);
    const watcher = useRef<FSWatcher | undefined>();

    useEffect(() => {
        const registerWatcher = async () => {
            // update saved handler, if necessary
            if (eventHandler && savedHandler.current !== eventHandler) {
                savedHandler.current = eventHandler;
            }
            // if filepath is undefined, then a virtual metafile is calling and no watcher is needed
            // if eventHandler is undefined, then no watcher is needed
            if (active.current && savedHandler.current && filepath !== undefined) {
                // create watcher for file or directory (and all subdirectories)
                watcher.current = watch(filepath.toString(), { ...options, ignoreInitial: true });
                watcher.current.on('all', savedHandler.current);
            }
        }
        registerWatcher();
        // remove all watchers on cleanup; called just before component unmount
        return () => {
            active.current = false;
            if (filepath !== undefined && watcher.current) watcher.current.close();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export default useWatcher;