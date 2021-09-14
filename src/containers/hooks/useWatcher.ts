import { useEffect, useRef } from 'react';
import { PathLike } from 'fs-extra';
import { FSWatcher, WatchOptions, watch } from 'chokidar';

export type WatchEventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir' | 'ready' | 'raw' | 'error';
export type WatchListener<T> = (event: WatchEventType, filename: T) => void;

const useWatcher = (filepath: PathLike, eventHandler: WatchListener<PathLike>, options?: WatchOptions): void => {
    // create a ref that caches the handler callback, and a ref to prevent race conditions on async requests
    const savedHandler = useRef<WatchListener<PathLike>>();
    const active = useRef(true);
    let watcher: FSWatcher | undefined;

    useEffect(() => {
        // if filepath is undefined, then a virtual metafile is calling and no watcher is needed
        const registerWatcher = async () => {
            // update saved handler, if necessary
            if (savedHandler.current !== eventHandler) {
                savedHandler.current = eventHandler;
            }

            if (active.current) {
                // create watcher for file or directory (and all subdirectories)
                watcher = watch(filepath.toString(), { ...options, ignoreInitial: true });
                watcher.on('all', savedHandler.current);
            }
        }
        registerWatcher();
        // remove all watchers on cleanup; called just before component unmount
        return () => {
            active.current = false;
            watcher.close();
        }
    }, []);
}

export default useWatcher;