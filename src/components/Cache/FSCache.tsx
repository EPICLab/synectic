import React, { createContext, useEffect } from 'react';
import { PathLike } from 'fs-extra';
import { FSWatcher, watch } from 'chokidar';
import useMap from '../../containers/hooks/useMap';
import { WatchEventType } from '../../containers/hooks/useWatcher';
import { isDirectory, readFileAsync } from '../../containers/io';

type FSCacheType = {
    cache: Omit<Map<PathLike, string>, "set" | "clear" | "delete">,
    subscribe: (filepath: PathLike) => Promise<void>,
    unsubscribe: (filepath: PathLike) => Promise<void>,
    reset: () => Promise<void>
}

export const FSCache = createContext<FSCacheType>({
    cache: new Map<PathLike, string>(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subscribe: (_filepath: PathLike) => { return new Promise(resolve => resolve()) },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unsubscribe: (_filepath: PathLike) => { return new Promise(resolve => resolve()) },
    reset: () => { return new Promise(resolve => resolve()) }
});

export const FSCacheProvider: React.FunctionComponent = props => {
    const [cache, cacheActions] = useMap<PathLike, string>([]);
    const [watchers, watcherActions] = useMap<PathLike, { watcher: FSWatcher, count: number }>([]);

    useEffect(() => {
        console.log('FSCache mount', props);
        return () => console.log('FSCache unmount', props);
    }, []);

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        switch (event) {
            case 'add': {
                if (!(await isDirectory(filename))) {
                    const content = await readFileAsync(filename, { encoding: 'utf-8' });
                    cacheActions.set(filename, content);

                    const newWatcher = watch(filename.toString(), { ignoreInitial: true });
                    newWatcher.on('all', eventHandler);
                    watcherActions.set(filename, { watcher: newWatcher, count: 1 });
                }
                break;
            }
            case 'change': {
                const content = await readFileAsync(filename, { encoding: 'utf-8' });
                cacheActions.set(filename, content);
                break;
            }
            case 'unlink': {
                watcherActions.remove(filename);
                cacheActions.remove(filename);
                break;
            }
            case 'unlinkDir': {
                console.log(`ERROR: FSCache saw 'unlinkDir' on ${filename.toString()}`);
                break;
            }
        }
    }

    const subscribe = async (filepath: PathLike) => {
        const watcher = watchers.get(filepath);

        if (watcher !== undefined && !isDirectory(filepath)) {
            watcherActions.set(filepath, { ...watcher, count: watcher.count + 1 });
        } else {
            await eventHandler('add', filepath);
        }
    };

    const unsubscribe = async (filepath: PathLike) => {
        const watcher = watchers.get(filepath);

        if (watcher !== undefined) {
            if (watcher.count > 1) {
                watcherActions.set(filepath, { ...watcher, count: watcher.count - 1 });
            } else {
                watcher.watcher.close();
                await eventHandler('unlink', filepath);
            }
        }
    };

    const reset = async () => {
        cache.forEach(async (_, filepath) => {
            await unsubscribe(filepath);
        });
    }

    return (
        <FSCache.Provider value={{ cache, subscribe, unsubscribe, reset }}>
            {props.children}
        </FSCache.Provider>
    );
}