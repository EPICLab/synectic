import { addListener, createListenerMiddleware, isAnyOf, isPending, isRejected, TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { isConflictManagerMetafile } from '../components/ConflictManager/ConflictManager';
import { checkUnmergedBranch } from '../containers/git';
import branchSelectors from './selectors/branches';
import cacheSelectors from './selectors/cache';
import cardSelectors from './selectors/cards';
import metafileSelectors from './selectors/metafiles';
import { cacheRemoved } from './slices/cache';
import { cardAdded, cardRemoved, cardUpdated } from './slices/cards';
import { isDirectoryMetafile, isFilebasedMetafile, isFileMetafile, Metafile, metafileRemoved, metafileUpdated } from './slices/metafiles';
import { AppDispatch, RootState } from './store';
import { removeBranch } from './thunks/branches';
import { subscribe, unsubscribe } from './thunks/cache';
import { switchBranch, updateConflicted, updateFilebasedMetafile, updateVersionedMetafile } from './thunks/metafiles';
import { UUID } from './types';

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
        console.log(`meta: `, action.meta);
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
        if (cardAdded.match(action) || cardUpdated.match(action)) {
            const metafile = listenerApi.getState().metafiles.entities[action.payload.metafile];

            if (metafile) {
                let metafiles: Metafile[] = [];

                if (isConflictManagerMetafile(metafile)) {
                    const branch = listenerApi.getState().branches.entities[metafile.branch];
                    const conflicts = branch ? await checkUnmergedBranch(branch.root, branch.ref) : undefined;
                    metafiles = conflicts ? await listenerApi.dispatch(updateConflicted(conflicts)).unwrap() : [];
                } else if (isFilebasedMetafile(metafile)) {
                    let updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
                    updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
                    metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
                        isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [metafile.id]) : [];
                }
                metafiles.filter(isFileMetafile).forEach(async metafile => {
                    await listenerApi.dispatch(subscribe({ path: metafile.path.toString(), card: action.payload.id }));
                });
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
        const card = listenerApi.getOriginalState().cards.entities[action.payload];
        const metafile = card ? listenerApi.getState().metafiles.entities[card.metafile] : undefined;

        if (card && metafile) {
            let metafiles: Metafile[] = [];

            if (isConflictManagerMetafile(metafile)) {
                const branch = listenerApi.getState().branches.entities[metafile.branch];
                const conflicts = branch ? await checkUnmergedBranch(branch.root, branch.ref) : undefined;
                metafiles = conflicts ? await listenerApi.dispatch(updateConflicted(conflicts)).unwrap() : [];
            } else if (isFilebasedMetafile(metafile)) {
                let updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
                updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
                metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
                    isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [metafile.id]) : [];
            }
            metafiles.filter(isFileMetafile).forEach(metafile => {
                const existing = cacheSelectors.selectById(listenerApi.getState(), metafile.path.toString());
                if (existing) {
                    if (existing && existing.reserved.length > 1) {
                        listenerApi.dispatch(unsubscribe({ path: existing.path, card: card.id }));
                    } else {
                        listenerApi.dispatch(cacheRemoved(existing.path));
                        listenerApi.dispatch(metafileRemoved(metafile.id));
                    }
                }
            });
        }
    }
});