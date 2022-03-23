import { createListenerMiddleware, isAnyOf, isFulfilled, TypedStartListening } from '@reduxjs/toolkit';
import { relative } from 'path';
import { v4 } from 'uuid';
import { removeUndefined } from '../../containers/format';
import { cachedAdded, cachedRemoved, cachedSubscribed, cachedUnsubscribed } from '../slices/cached';
import { cardRemoved } from '../slices/cards';
import { Metafile, metafileAdded, metafileRemoved } from '../slices/metafiles';
import { RootState } from '../store';
import { fetchMetafilesByFilepath, fetchMetafilesByVirtual, fetchNewMetafile, isDirectoryMetafile, isFilebasedMetafile, isFileMetafile } from '../thunks/metafiles';

export const cacheMiddleware = createListenerMiddleware();

const startAppListening = cacheMiddleware.startListening as TypedStartListening<RootState>;

startAppListening({
    actionCreator: metafileRemoved,
    effect: async (action, listenerApi) => {
        const metafile = listenerApi.getOriginalState().metafiles.entities[action.payload];
        if (metafile && isFileMetafile(metafile)) {
            const cached = removeUndefined(Object.values(listenerApi.getState().cached.entities))
                .find(cachedFile => cachedFile.path === metafile.path);
            if (cached) {
                if (cached.reserves > 1) {
                    listenerApi.dispatch(cachedUnsubscribed(cached));
                } else {
                    listenerApi.dispatch(cachedRemoved(cached.id));
                }
            }
        }
    }
});

startAppListening({
    actionCreator: cardRemoved,
    effect: async (action, listenerApi) => {
        const card = listenerApi.getOriginalState().cards.entities[action.payload];
        const metafile = card ? listenerApi.getOriginalState().metafiles.entities[card.metafile] : undefined;

        if (card && metafile) {
            const filepaths = isDirectoryMetafile(metafile) ? metafile.contains :
                isFileMetafile(metafile) ? [metafile.path.toString()] : [];
            const metafiles = removeUndefined(Object.values(listenerApi.getOriginalState().metafiles.entities));

            const targetMetafiles = metafiles.filter(m =>
                filepaths.find(f => m.path && relative(f, m.path.toString()).length === 0));
            const cached = removeUndefined(Object.values(listenerApi.getState().cached.entities));
            targetMetafiles.filter(isFilebasedMetafile)
                .forEach(metafile => {
                    const existing = cached.find(cachedFile =>
                        relative(cachedFile.path.toString(), metafile.path.toString()).length === 0);
                    if (existing) {
                        if (existing.reserves > 1) {
                            listenerApi.dispatch(cachedUnsubscribed(existing));
                        } else {
                            listenerApi.dispatch(metafileRemoved(metafile.id));
                            listenerApi.dispatch(cachedRemoved(existing.id));
                        }
                    }
                });
        }
    }
});

startAppListening({
    actionCreator: metafileAdded,
    effect: (action, listenerApi) => {
        const metafile: Metafile = action.payload;
        if (isFileMetafile(metafile)) {
            listenerApi.dispatch(cachedAdded({
                id: v4(),
                reserves: 0,
                path: metafile.path,
                metafile: metafile.id
            }));
        }
    }
});

startAppListening({
    matcher: isFulfilled(fetchNewMetafile),
    effect: async (action, listenerApi) => {
        const metafile: Metafile = action.payload;
        if (isFileMetafile(metafile)) {
            const cached = removeUndefined(Object.values(listenerApi.getState().cached.entities))
                .find(cachedFile => cachedFile.path === metafile.path);
            if (cached) listenerApi.dispatch(cachedSubscribed(cached));
        }
    }
});

startAppListening({
    matcher: isAnyOf(isFulfilled(fetchMetafilesByFilepath), isFulfilled(fetchMetafilesByVirtual)),
    effect: async (action, listenerApi) => {
        const metafile: Metafile = action.payload[0];
        if (isFileMetafile(metafile)) {
            const cached = removeUndefined(Object.values(listenerApi.getState().cached.entities))
                .find(cachedFile => cachedFile.path === metafile.path);
            if (cached) listenerApi.dispatch(cachedSubscribed(cached));
        }
    }
});