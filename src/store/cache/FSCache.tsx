import { FSWatcher, watch } from 'chokidar';
import { createHash } from 'crypto';
import { diffArrays } from 'diff';
import { PathLike } from 'fs-extra';
import React, { ReactNode, createContext, useContext, useEffect } from 'react';
import { flattenArray } from '../../containers/flatten';
import useMap, { ReturnMap } from '../../containers/hooks/useMap';
import { WatchEventType } from '../../containers/hooks/useWatcher';
import { extractStats, isEqualPaths, readFileAsync } from '../../containers/io';
import { isDefined } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../hooks';
import cacheSelectors from '../selectors/cache';
import cardSelectors from '../selectors/cards';
import metafileSelectors from '../selectors/metafiles';
import { cacheRemoved, cacheUpdated } from '../slices/cache';
import { Card } from '../slices/cards';
import { isDirectoryMetafile, isFileMetafile, isFilebasedMetafile, metafileRemoved } from '../slices/metafiles';
import { fetchCache } from '../thunks/cache';
import { fetchMetafile } from '../thunks/metafiles';

export const FSCacheContext = createContext<ReturnMap<PathLike, FSWatcher>>([
    new Map([]),
    { set: () => null, setAll: () => null, remove: () => null, reset: () => null }
]);

const FSCacheServices = ({ children }: { children: ReactNode }) => {
    const cacheIds = useAppSelector(state => cacheSelectors.selectIds(state));
    const cards = useAppSelector(state => cardSelectors.selectAll(state));
    const metafiles = useAppSelector(state => metafileSelectors.selectEntities(state));
    const [watchers, watcherActions] = useContext(FSCacheContext);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const asyncUpdate = async () => {
            const diff = diffArrays(Array.from(watchers.keys()).map(k => k.toString()), cacheIds as string[]);
            const added = flattenArray(diff.filter(change => change.added === true).map(change => change.value));
            const removed = flattenArray(diff.filter(change => change.removed === true).map(change => change.value));
            console.error(`FSCacheService useEffect updates... { added: ${added.length}, removed: ${removed.length} }`);
            await Promise.all(added.map(filepath => eventHandler('add', filepath)));
            await Promise.all(removed.map(filepath => eventHandler('unlink', filepath)));
        }
        asyncUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheIds]);

    const selectByFilepath = (filepath: PathLike): Card | undefined => {
        return cards.filter(c => {
            const metafile = metafiles[c.metafile];
            if (isDefined(metafile) && isFileMetafile(metafile)) {
                return isEqualPaths(metafile.path, filepath);
            } else if (isDefined(metafile) && isDirectoryMetafile(metafile)) {
                return metafile.contains.filter(m => {
                    const child = metafiles[m];
                    return isDefined(child) && isFilebasedMetafile(child) && isEqualPaths(child.path, filepath);
                }).length > 0;
            }
        })[0];
    }

    const eventHandler = async (event: WatchEventType, filename: PathLike) => {
        switch (event) {
            case 'add': {
                const stats = await extractStats(filename);
                const metafile = await dispatch(fetchMetafile({ path: filename })).unwrap();
                const card = selectByFilepath(filename);
                const existing = watchers.has(filename);


                if (!existing && card && stats && !stats.isDirectory()) { // verify file exists on FS and is not a directory
                    const newWatcher = watch(filename.toString(), { ignoreInitial: true });
                    newWatcher.on('all', eventHandler);
                    watcherActions.set(filename, newWatcher);
                } else if (!existing && !stats) {
                    dispatch(metafileRemoved(metafile.id));
                }
                break;
            }
            case 'change': {
                const existing = await dispatch(fetchCache(filename.toString())).unwrap();
                if (existing) {
                    console.log(`FSCache change event: ${filename.toString()}`);
                    dispatch(cacheUpdated({
                        ...existing,
                        content: createHash('md5').update(await readFileAsync(filename, { encoding: 'utf-8' })).digest('hex')
                    }));
                }
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
                console.error(`ERROR: FSCache saw 'unlinkDir' on ${filename.toString()}`);
                break;
            }
        }
    }

    return (
        <FSCacheContext.Provider value={[watchers, watcherActions]}>
            {children}
        </FSCacheContext.Provider>
    );
}

export const FSCacheProvider = ({ children }: { children: ReactNode }) => {
    // Map from absolute filepath to FSWatcher instance
    const [watchers, watcherActions] = useMap<PathLike, FSWatcher>([]);

    return (
        <FSCacheContext.Provider value={[watchers, watcherActions]}>
            <FSCacheServices>
                {children}
            </FSCacheServices>
        </FSCacheContext.Provider>
    )
}