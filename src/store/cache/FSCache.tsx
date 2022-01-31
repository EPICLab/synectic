import React, { createContext, useEffect } from 'react';
import { PathLike } from 'fs-extra';
import { FSWatcher, watch } from 'chokidar';
import useMap from '../../containers/hooks/useMap';
import { WatchEventType } from '../../containers/hooks/useWatcher';
import { extractStats, readFileAsync } from '../../containers/io';
import { useAppDispatch, useAppSelector } from '../hooks';
import { RootState } from '../store';
import cachedSelectors from '../selectors/cached';
import { metafileRemoved } from '../slices/metafiles';
import { fetchMetafilesByFilepath } from '../thunks/metafiles';

type FSCacheType = {
    cache: Omit<Map<PathLike, string>, "set" | "clear" | "delete">
}

export const FSCache = createContext<FSCacheType>({
    cache: new Map<PathLike, string>()
});

export const FSCacheProvider: React.FunctionComponent = props => {
    const cached = useAppSelector((state: RootState) => cachedSelectors.selectAll(state));
    const [cache, cacheActions] = useMap<PathLike, string>([]); // filepath to cached file content
    const [watchers, watcherActions] = useMap<PathLike, FSWatcher>([]); // filepath to file watcher
    const dispatch = useAppDispatch();

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
                const stats = await extractStats(filename);
                if (stats && !stats.isDirectory()) { // verify file exists on FS and is not a directory
                    const content = await readFileAsync(filename, { encoding: 'utf-8' });
                    cacheActions.set(filename, content);

                    const newWatcher = watch(filename.toString(), { ignoreInitial: true });
                    newWatcher.on('all', eventHandler);
                    watcherActions.set(filename, newWatcher);
                } else if (!stats) {
                    const metafiles = (await dispatch(fetchMetafilesByFilepath(filename)).unwrap());
                    if (metafiles.length > 0) dispatch(metafileRemoved(metafiles[0].id));
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