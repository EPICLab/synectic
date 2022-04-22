import React, { createContext, PropsWithChildren, ReactNode, useEffect } from 'react';
import { PathLike } from 'fs-extra';
import { FSWatcher, watch } from 'chokidar';
import useMap from '../../containers/hooks/useMap';
import { WatchEventType } from '../../containers/hooks/useWatcher';
import { extractStats, readFileAsync } from '../../containers/io';
import { useAppDispatch, useAppSelector } from '../hooks';
import { RootState } from '../store';
import { metafileRemoved } from '../slices/metafiles';
import cacheSelectors from '../selectors/cache';
import { diffArrays } from 'diff';
import { flattenArray } from '../../containers/flatten';
import { cacheRemoved, cacheUpdated } from '../slices/cache';
import { fetchCache } from '../thunks/cache';
import { fetchMetafile } from '../thunks/metafiles';

export const FSCache = createContext({});

export const FSCacheProvider = (props: PropsWithChildren<ReactNode>) => {
    const cacheIds = useAppSelector((state: RootState) => cacheSelectors.selectIds(state));
    const [watchers, watcherActions] = useMap<PathLike, FSWatcher>([]); // filepath to file watcher
    const dispatch = useAppDispatch();

    useEffect(() => {
        const asyncUpdate = async () => {
            const diff = diffArrays(Array.from(watchers.keys()).map(k => k.toString()), cacheIds as string[]);
            const added = flattenArray(diff.filter(change => change.added === true).map(change => change.value));
            const removed = flattenArray(diff.filter(change => change.removed === true).map(change => change.value));
            await Promise.all(added.map(filepath => eventHandler('add', filepath)));
            await Promise.all(removed.map(filepath => eventHandler('unlink', filepath)));
        }
        asyncUpdate();
    }, [cacheIds]);

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        switch (event) {
            case 'add': {
                const stats = await extractStats(filename);
                if (stats && !stats.isDirectory()) { // verify file exists on FS and is not a directory
                    dispatch(fetchCache(filename));
                    const newWatcher = watch(filename.toString(), { ignoreInitial: true });
                    newWatcher.on('all', eventHandler);
                    watcherActions.set(filename, newWatcher);
                } else if (!stats) {
                    const metafile = await dispatch(fetchMetafile(filename)).unwrap();
                    dispatch(metafileRemoved(metafile.id));
                }
                break;
            }
            case 'change': {
                const existing = cacheIds.find(cache => cache === filename.toString());
                if (existing) dispatch(cacheUpdated({
                    id: existing,
                    changes: { content: await readFileAsync(filename, { encoding: 'utf-8' }) }
                }));
                break;
            }
            case 'unlink': {
                const watcher = watchers.get(filename);
                if (watcher) watcher.close();
                watcherActions.remove(filename);
                dispatch(cacheRemoved(filename.toString()));
                break;
            }
            case 'unlinkDir': {
                console.log(`ERROR: FSCache saw 'unlinkDir' on ${filename.toString()}`);
                break;
            }
        }
    }

    return (
        <FSCache.Provider value={{}}>
            {props.children}
        </FSCache.Provider>
    );
}