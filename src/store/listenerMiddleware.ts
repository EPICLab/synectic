import { createListenerMiddleware, addListener, TypedStartListening, TypedAddListener } from '@reduxjs/toolkit';
import cacheSelectors from './selectors/cache';
import metafileSelectors from './selectors/metafiles';
import { cacheRemoved, cacheUpdated } from './slices/cache';
import { cardAdded, cardUpdated } from './slices/cards';
import { isDirectoryMetafile, isFilebasedMetafile, isFileMetafile, metafileRemoved } from './slices/metafiles';
import { RootState, AppDispatch } from './store';
import { fetchCache } from './thunks/cache';
import { updatedVersionedMetafile, updateFilebasedMetafile } from './thunks/metafiles';

export const listenerMiddleware = createListenerMiddleware<RootState>();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

/// Metafile is created for root
/// Card is created to contain root
/// Listener is triggered and updates root to include child dirs/files
/// this only results in unhydrated metafiles for children

startAppListening({
    predicate: (action, _, previousState) => {
        if (cardAdded.match(action)) return true;
        if (cardUpdated.match(action)) {
            const prev = previousState.cards.entities[action.payload.id];
            return prev ? action.payload.metafile !== prev.metafile : false;
        }
        return false;
    },
    effect: async (action, listenerApi) => {
        const card = action.payload;
        const metafile = metafileSelectors.selectById(listenerApi.getState(), card.metafile);
        console.log(`AppListener for ${metafile?.name}`);

        if (metafile) {
            listenerApi.unsubscribe();

            if (isFilebasedMetafile(metafile)) {
                const updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
                await listenerApi.dispatch(updatedVersionedMetafile(metafile));
                await listenerApi.dispatch(fetchCache(metafile.path));

                if (isDirectoryMetafile(updated)) {
                    const children = metafileSelectors.selectByIds(listenerApi.getState(), updated.contains);
                    await Promise.all(children.filter(isFilebasedMetafile).map(child => listenerApi.dispatch(updateFilebasedMetafile(child))));
                }
            }

            listenerApi.subscribe();
        }
    },
});

startAppListening({
    actionCreator: metafileRemoved,
    effect: (action, listenerApi) => {
        const metafile = listenerApi.getOriginalState().metafiles.entities[action.payload];
        if (metafile && isFileMetafile(metafile)) {
            const cache = cacheSelectors.selectById(listenerApi.getState(), metafile.path.toString());
            if (cache) {
                (cache.reserve > 1) ? listenerApi.dispatch(cacheUpdated({
                    id: cache.path,
                    changes: { reserve: cache.reserve - 1 }
                })) : listenerApi.dispatch(cacheRemoved(metafile.path.toString()));
            }
        }
    }
});