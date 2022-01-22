import React, { createContext, useEffect } from 'react';
import { PathLike } from 'fs-extra';
import { FSWatcher, watch } from 'chokidar';
import useMap from '../../containers/hooks/useMap';
import { WatchEventType } from '../../containers/hooks/useWatcher';
import { isDirectory, readFileAsync } from '../../containers/io';
import { useAppSelector } from '../hooks';
import { RootState } from '../store';
import cachedSelectors from '../selectors/cached';

type FSCacheType = {
    cache: Omit<Map<PathLike, string>, "set" | "clear" | "delete">
}

export const FSCache = createContext<FSCacheType>({
    cache: new Map<PathLike, string>()
});

export const FSCacheProvider: React.FunctionComponent = props => {
    const cached = useAppSelector((state: RootState) => cachedSelectors.selectAll(state));
    const [cache, cacheActions] = useMap<PathLike, string>([]);
    const [watchers, watcherActions] = useMap<PathLike, FSWatcher>([]);

    useEffect(() => {
        const asyncUpdate = async () => {
            const added = cached.filter(cachedFile => !cache.has(cachedFile.path));
            const removed = Array.from(cache.keys()).filter(cachePath => !cached.find(cachedFile => cachedFile.path.toString() === cachePath.toString()));
            await Promise.all(added.map(cachedFile => eventHandler('add', cachedFile.path)));
            await Promise.all(removed.map(cachePath => eventHandler('unlink', cachePath)));
        }
        asyncUpdate();
    }, [cached]);

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        switch (event) {
            case 'add': {
                if (!(await isDirectory(filename))) {
                    const content = await readFileAsync(filename, { encoding: 'utf-8' });
                    cacheActions.set(filename, content);

                    const newWatcher = watch(filename.toString(), { ignoreInitial: true });
                    newWatcher.on('all', eventHandler);
                    watcherActions.set(filename, newWatcher);
                }
                break;
            }
            case 'change': {
                const content = await readFileAsync(filename, { encoding: 'utf-8' });
                cacheActions.set(filename, content);
                break;
            }
            case 'unlink': {
                const watcher = watchers.get(filename.toString());
                if (watcher) watcher.close();
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

    return (
        <FSCache.Provider value={{ cache }}>
            {props.children}
        </FSCache.Provider>
    );
}