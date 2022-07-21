import { createListenerMiddleware, addListener, TypedStartListening, TypedAddListener, isRejected, isAnyOf, isPending } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import cacheSelectors from './selectors/cache';
import cardSelectors from './selectors/cards';
import metafileSelectors from './selectors/metafiles';
import { cacheRemoved } from './slices/cache';
import { cardAdded, cardRemoved, cardUpdated } from './slices/cards';
import { isDirectoryMetafile, isFilebasedMetafile, isFileMetafile, metafileUpdated } from './slices/metafiles';
import { RootState, AppDispatch } from './store';
import { checkoutBranch } from './thunks/branches';
import { subscribe, unsubscribe } from './thunks/cache';
import { createMetafile, fetchMetafile, fetchParentMetafile, updateVersionedMetafile, updateFilebasedMetafile } from './thunks/metafiles';
import { fetchRepo, createRepo } from './thunks/repos';
import { UUID } from './types';

export const listenerMiddleware = createListenerMiddleware<RootState>();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

const isRejectedAction = isRejected(fetchMetafile, createMetafile, updateFilebasedMetafile, updateVersionedMetafile, fetchParentMetafile, fetchRepo, createRepo);

startAppListening({
    matcher: isRejectedAction,
    effect: async (action) => {
        console.group(`${action.type} : ${DateTime.local().toHTTP()}`);
        console.log(action.error);
        console.groupEnd();
    }
});

startAppListening({
    matcher: isAnyOf(updateVersionedMetafile.pending, updateVersionedMetafile.fulfilled, updateVersionedMetafile.rejected),
    effect: async (action, listenerApi) => {
        if (isPending(updateVersionedMetafile)(action)) {
            listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, loading: [...action.meta.arg.loading, 'versioned'] }));
        }
        if (isAnyOf(updateVersionedMetafile.fulfilled, updateVersionedMetafile.rejected)(action)) {
            listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, loading: action.meta.arg.loading.filter(flag => flag !== 'versioned') }));
        }
    }
});

startAppListening({
    matcher: isAnyOf(checkoutBranch.pending, checkoutBranch.fulfilled, checkoutBranch.rejected),
    effect: async (action, listenerApi) => {
        if (isPending(checkoutBranch)(action)) {
            const metafile = metafileSelectors.selectById(listenerApi.getState(), action.meta.arg.metafileId);
            if (metafile) listenerApi.dispatch(metafileUpdated({ ...metafile, loading: [...metafile.loading, 'checkout'] }));
        }
        if (isAnyOf(checkoutBranch.fulfilled, checkoutBranch.rejected)(action)) {
            const metafile = metafileSelectors.selectById(listenerApi.getState(), action.meta.arg.metafileId);
            if (metafile) listenerApi.dispatch(metafileUpdated({ ...metafile, loading: metafile.loading.filter(flag => flag !== 'checkout') }));
        }
    }
});

startAppListening({
    actionCreator: cardRemoved,
    effect: async (action, listenerApi) => {
        const diffs = cardSelectors.selectByTarget(listenerApi.getState(), action.payload as UUID);
        diffs.map(card => listenerApi.dispatch(cardRemoved(card.id)))
    }
});

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

            if (isFilebasedMetafile(metafile)) {
                const updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
                await listenerApi.dispatch(updateVersionedMetafile(metafile));

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
                        listenerApi.dispatch(unsubscribe({ path: existing.path, metafile: metafile.id }));
                    } else {
                        listenerApi.dispatch(cacheRemoved(existing.path));
                    }
                }
            });
        }
    }
});