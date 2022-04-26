import { createListenerMiddleware, addListener, TypedStartListening, TypedAddListener } from '@reduxjs/toolkit';
import cacheSelectors from './selectors/cache';
import metafileSelectors from './selectors/metafiles';
import { cacheRemoved } from './slices/cache';
import { cardAdded, cardRemoved, cardUpdated } from './slices/cards';
import { isDirectoryMetafile, isFilebasedMetafile, isFileMetafile } from './slices/metafiles';
import { RootState, AppDispatch } from './store';
import { subscribe, unsubscribe } from './thunks/cache';
import { updatedVersionedMetafile, updateFilebasedMetafile } from './thunks/metafiles';

export const listenerMiddleware = createListenerMiddleware<RootState>();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

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
        const metafile = metafileSelectors.selectById(listenerApi.getState(), action.payload.metafile);

        if (metafile && (cardAdded.match(action) || cardUpdated.match(action))) {
            listenerApi.unsubscribe();

            if (isFilebasedMetafile(metafile)) {
                const updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
                await listenerApi.dispatch(updatedVersionedMetafile(metafile));

                if (isDirectoryMetafile(updated)) {
                    const children = metafileSelectors.selectByIds(listenerApi.getState(), updated.contains);
                    await Promise.all(children.filter(isFilebasedMetafile).map(child =>
                        listenerApi.dispatch(updateFilebasedMetafile(child))
                    ));
                }

                if (isFileMetafile(updated)) {
                    await listenerApi.dispatch(subscribe({ path: updated.path.toString(), metafile: updated.id }));
                }
            }

            listenerApi.subscribe();
        }
    },
});

startAppListening({
    actionCreator: cardRemoved,
    effect: async (action, listenerApi) => {
        const state = listenerApi.getState();
        const card = listenerApi.getOriginalState().cards.entities[action.payload];
        const metafile = card ? state.metafiles.entities[card.metafile] : undefined;
        if (card && metafile) {
            const childIds = isDirectoryMetafile(metafile) ? metafile.contains :
                isFileMetafile(metafile) ? [metafile.id] : [];
            const metafiles = metafileSelectors.selectByIds(state, childIds);
            metafiles.filter(isFilebasedMetafile).forEach(metafile => {
                const existing = cacheSelectors.selectById(state, metafile.path.toString());
                if (existing) {
                    if (existing && existing.reserved.length > 1) {
                        console.log(`AppListener saw ${action.type} action: unsubscribing to cache for ${existing.path}`);
                        listenerApi.dispatch(unsubscribe({ path: existing.path, metafile: metafile.id }));
                    } else {
                        console.log(`AppListener saw ${action.type} action: removing cache for ${existing.path}`);
                        listenerApi.dispatch(cacheRemoved(existing.path));
                    }
                }
            });
        }
    }
});