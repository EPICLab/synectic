import { createListenerMiddleware, addListener, TypedStartListening, TypedAddListener, isRejected, isAnyOf, isPending } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import cacheSelectors from './selectors/cache';
import cardSelectors from './selectors/cards';
import metafileSelectors from './selectors/metafiles';
import { cacheRemoved } from './slices/cache';
import { cardAdded, cardRemoved, cardUpdated } from './slices/cards';
import { isDirectoryMetafile, isFilebasedMetafile, isFileMetafile, metafileRemoved, metafileUpdated } from './slices/metafiles';
import { RootState, AppDispatch } from './store';

import { subscribe, unsubscribe } from './thunks/cache';
import { updateVersionedMetafile, updateFilebasedMetafile, switchBranch } from './thunks/metafiles';
import { UUID } from './types';
import branchSelectors from './selectors/branches';
import { removeBranch } from './thunks/branches';

export const listenerMiddleware = createListenerMiddleware<RootState>();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

/**
 * Listen for rejected actions and log relevant information in the console.
 */
startAppListening({
    matcher: isRejected,
    effect: async (action) => {
        console.group(`${action.type} : ${DateTime.local().toHTTP()}`);
        console.log(action.error);
        console.groupEnd();
    }
});

/**
 * Listen for pending updates to Metafiles to toggle `loading` flags for UI indicators.
 */
startAppListening({
    matcher: isAnyOf(updateVersionedMetafile.pending, updateVersionedMetafile.fulfilled, updateVersionedMetafile.rejected),
    effect: async (action, listenerApi) => {
        if (isPending(updateVersionedMetafile)(action)) {
            listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, loading: [...action.meta.arg.loading, 'versioned'] }));
        }
        if (isAnyOf(updateVersionedMetafile.fulfilled, updateVersionedMetafile.rejected)(action)) {
            const metafile = listenerApi.getState().metafiles.entities[action.meta.arg.id];
            if (metafile) listenerApi.dispatch(metafileUpdated({ ...metafile, loading: action.meta.arg.loading.filter(flag => flag !== 'versioned') }));
        }
    }
});

/**
 * Listen for switch branch actions and update Metafiles to toggle `checkout` flags for UI indicators.
 */
startAppListening({
    matcher: isAnyOf(switchBranch.pending, switchBranch.fulfilled, switchBranch.rejected),
    effect: async (action, listenerApi) => {
        if (isPending(switchBranch)(action)) {
            const branch = branchSelectors.selectByRef(listenerApi.getState(), action.meta.arg.ref)[0];
            const metafiles = branch ? metafileSelectors.selectByBranch(listenerApi.getState(), branch.id, action.meta.arg.root) : [];
            metafiles.map(metafile => listenerApi.dispatch(metafileUpdated({ ...metafile, loading: [...metafile.loading, 'checkout'] })));
        }
        if (isAnyOf(switchBranch.fulfilled, switchBranch.rejected)(action)) {
            const branch = branchSelectors.selectByRef(listenerApi.getState(), action.meta.arg.ref)[0];
            const metafiles = branch ? metafileSelectors.selectByBranch(listenerApi.getState(), branch.id, action.meta.arg.root) : [];
            metafiles.map(metafile => listenerApi.dispatch(metafileUpdated({ ...metafile, loading: metafile.loading.filter(flag => flag !== 'checkout') })));
        }
    }
});

/**
 * Listen for card removal actions and remove any Diff cards that reference that card.
 */
startAppListening({
    actionCreator: cardRemoved,
    effect: async (action, listenerApi) => {
        const diffs = cardSelectors.selectByTarget(listenerApi.getState(), action.payload as UUID);
        diffs.map(card => listenerApi.dispatch(cardRemoved(card.id)));
    }
});

/**
 * Listen for branch removal actions and remove any cards that reference that branch.
 */
startAppListening({
    actionCreator: removeBranch.fulfilled,
    effect: async (action, listenerApi) => {
        if (action.payload === true) {
            const cards = cardSelectors.selectByRepo(listenerApi.getState(), action.meta.arg.repoId, action.meta.arg.branch.id);
            cards.map(card => listenerApi.dispatch(cardRemoved(card.id)));
        }
    }
});

/**
 * Listen for card adding/switching actions and update child Metafiles in directories, subscriptions, and cache adding.
 */
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

                if (isFileMetafile(updated)) {
                    await listenerApi.dispatch(subscribe({ path: updated.path.toString(), card: action.payload.id }));
                }
                if (isDirectoryMetafile(updated)) {
                    const children = metafileSelectors.selectByIds(listenerApi.getState(), updated.contains);
                    children.filter(isFilebasedMetafile).forEach(async metafile => {
                        await listenerApi.dispatch(subscribe({ path: metafile.path.toString(), card: action.payload.id }));
                    });
                }
            }
        }
    }
});

/**
 * Listen for card removal actions and update child Metafiles in directories, subscriptions, and cache removals.
 */
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
                        console.log(`unsubscribing for ${existing.path}`);
                        listenerApi.dispatch(unsubscribe({ path: existing.path, card: card.id }));
                    } else {
                        console.log(`removing cache and metafile for ${existing.path}`);
                        listenerApi.dispatch(cacheRemoved(existing.path));
                        listenerApi.dispatch(metafileRemoved(metafile.id));
                    }
                }
            });
        }
    }
});