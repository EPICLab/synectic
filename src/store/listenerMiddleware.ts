import { TypedAddListener, TypedStartListening, addListener, createListenerMiddleware, isAnyOf, isFulfilled, isRejected } from '@reduxjs/toolkit';
import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import { isDefined } from '../containers/utils';
import branchSelectors from './selectors/branches';
import cacheSelectors from './selectors/cache';
import cardSelectors from './selectors/cards';
import metafileSelectors from './selectors/metafiles';
import { cacheUpdated } from './slices/cache';
import { cardRemoved } from './slices/cards';
import { isDirectoryMetafile, isFileMetafile, isFilebasedMetafile, metafileUpdated } from './slices/metafiles';
import { AppDispatch, RootState } from './store';
import { removeBranch } from './thunks/branches';
import { subscribeAll, unsubscribe } from './thunks/cache';
import { buildCard } from './thunks/cards';
import { switchBranch, updateFilebasedMetafile, updateVersionedMetafile } from './thunks/metafiles';

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
        console.log(`payload: `, action.payload);
        console.log(action.error);
        console.groupEnd();
    }
});

/**
 * Listen for successful card build and update additional Metafile fields (filebased and versioned), and cache subscriptions.
 */
startAppListening({
    actionCreator: buildCard.fulfilled,
    effect: async (action, listenerApi) => {
        const metafile = listenerApi.getState().metafiles.entities[action.payload.metafile];
        if (isFilebasedMetafile(metafile)) {
            // update filebased fields
            const updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
            const descendants = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains).filter(isFilebasedMetafile) : [];
            await Promise.all(descendants.map(async desc => await listenerApi.dispatch(updateFilebasedMetafile(desc))));

            // update versioned fields
            await listenerApi.dispatch(updateVersionedMetafile(metafile));
            await Promise.all(descendants.map(async desc => await listenerApi.dispatch(updateVersionedMetafile(desc))));

            // update FSCache subscriptions
            const descendantsUpdated = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains).filter(isFilebasedMetafile) : [];
            await listenerApi.dispatch(subscribeAll({ paths: [metafile, ...descendantsUpdated].filter(isFileMetafile).map(m => m.path), card: action.payload.id }));
        }
    }
});

/**
 * Listen for cache updates and check for corresponding file content updates that should be reflected in the Metafile.
 */
startAppListening({
    actionCreator: cacheUpdated,
    effect: async (action, listenerApi) => {
        const cached = action.payload;
        const metafile = metafileSelectors.selectByFilepath(listenerApi.getState(), cached.path)[0];
        if (isFileMetafile(metafile)) {
            const content = createHash('md5').update(metafile.content).digest('hex');
            // TODO: prompt the user to resolve the version conflict when metafile has a `modified` state 
            // and the cache indicates that updates should flow from filesystem into metafile
            if (content != cached.content) {
                await listenerApi.dispatch(updateFilebasedMetafile(metafile));
                await listenerApi.dispatch(updateVersionedMetafile(metafile));
            }
        }
    }
});

/**
 * Listen for card removed and update cache subscriptions; and also handle the case of Diff cards that might ref the removed card.
 */
startAppListening({
    actionCreator: cardRemoved,
    effect: async (action, listenerApi) => {
        const card = listenerApi.getOriginalState().cards.entities[action.payload];
        const metafile = card ? listenerApi.getState().metafiles.entities[card.metafile] : undefined;

        // handle Diff cards that contain a reference to the removed card
        const diffs = cardSelectors.selectByTarget(listenerApi.getState(), action.payload.toString());
        diffs.map(card => listenerApi.dispatch(cardRemoved(card.id)));

        if (isDefined(card) && isFilebasedMetafile(metafile)) {
            const descendants = isDirectoryMetafile(metafile) ? metafileSelectors.selectByIds(listenerApi.getState(), metafile.contains).filter(isFilebasedMetafile) : [];
            await Promise.all([metafile, ...descendants].map(async metafile => await listenerApi.dispatch(unsubscribe({ path: metafile.path, card: card.id }))));
        }
    }
});


/**
 * Listen for pending Metafile async thunk update actions and add the `updating` flag.
 */
startAppListening({
    matcher: isAnyOf(updateFilebasedMetafile.pending, updateVersionedMetafile.pending),
    effect: async (action, listenerApi) => {
        if (isAnyOf(updateFilebasedMetafile.pending, updateVersionedMetafile.pending)(action) && action.meta.arg.flags.every(flag => flag !== 'updating')) {
            listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, flags: [...action.meta.arg.flags, 'updating'] }));
        }
    }
});

/**
 * Listen for fulfilled/rejected Metafile async thunk update actions and remove the `updating` flag.
 */
startAppListening({
    matcher: isAnyOf(updateFilebasedMetafile.fulfilled, updateVersionedMetafile.fulfilled, updateFilebasedMetafile.rejected, updateVersionedMetafile.rejected),
    effect: async (action, listenerApi) => {
        if (isFulfilled(updateFilebasedMetafile, updateVersionedMetafile)(action)) {
            listenerApi.dispatch(metafileUpdated({ ...action.payload, flags: action.meta.arg.flags.filter(flag => flag !== 'updating') }));
        }
        if (isRejected(updateFilebasedMetafile, updateVersionedMetafile)(action)) {
            listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, flags: action.meta.arg.flags.filter(flag => flag !== 'updating') }));
        }
    }
});

/**
 * Listen for pending Branch switches and add the `checkout` flag to all related Metafiles.
 */
startAppListening({
    actionCreator: switchBranch.pending,
    effect: async (action, listenerApi) => {
        const branch = branchSelectors.selectByRef(listenerApi.getState(), action.meta.arg.ref)[0];
        const metafiles = branch ? metafileSelectors.selectByBranch(listenerApi.getState(), branch.id, action.meta.arg.root) : [];
        metafiles
            .filter(metafile => metafile.flags.every(flag => flag !== 'checkout'))
            .map(metafile => listenerApi.dispatch(metafileUpdated({ ...metafile, flags: [...metafile.flags, 'checkout'] })));
    }
});


/**
 * Listen for switch branch actions and update Metafiles to toggle `checkout` flags for UI indicators.
 */
startAppListening({
    matcher: isAnyOf(switchBranch.fulfilled, switchBranch.rejected),
    effect: async (action, listenerApi) => {
        if (isAnyOf(switchBranch.fulfilled, switchBranch.rejected)(action)) {
            const branch = branchSelectors.selectByRef(listenerApi.getState(), action.meta.arg.ref)[0];
            const metafiles = branch ? metafileSelectors.selectByBranch(listenerApi.getState(), branch.id, action.meta.arg.root) : [];
            metafiles
                .map(metafile => listenerApi.dispatch(metafileUpdated({ ...metafile, flags: metafile.flags.filter(flag => flag !== 'checkout') })));
        }
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
 * Listen for card update actions and update cache subscriptions.
 */
startAppListening({
    actionCreator: cardUpdated,
    effect: async (action, listenerApi) => {
        const prevCard = listenerApi.getOriginalState().cards.entities[action.payload.id];

        // if there is a previous metafile, then we might need to update subscriptions
        if (prevCard?.metafile) {
            const previous = listenerApi.getOriginalState().metafiles.entities[prevCard.metafile];
            const current = listenerApi.getState().metafiles.entities[action.payload.metafile];

            if (previous && current && previous.id != current.id) { // handle when previous and current metafile differ (e.g. 'metafiles/switchBranch')
                if (isFilebasedMetafile(previous)) { // unsubscribe from the previous metafile
                    await listenerApi.dispatch(unsubscribe({ path: previous.path.toString(), card: action.payload.id }));
                }

                if (isFilebasedMetafile(current)) { // subscribe to the current metafile
                    let updated = await listenerApi.dispatch(updateFilebasedMetafile(current)).unwrap();
                    updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
                    const metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
                        isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [current.id]) : [];
                    const paths = metafiles.filter(isFileMetafile).map(m => m.path);
                    listenerApi.dispatch(subscribeAll({ paths: paths, card: action.payload.id }));
                }
            }
        }

        // if no previous metafile, then check for a current metafile and subscribe to it
        if (!prevCard || !prevCard.metafile) {
            const metafile = listenerApi.getState().metafiles.entities[action.payload.metafile];

            if (metafile && isFilebasedMetafile(metafile)) {
                let updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
                updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
                const metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
                    isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [metafile.id]) : [];
                const paths = metafiles.filter(isFileMetafile).map(m => m.path);
                listenerApi.dispatch(subscribeAll({ paths: paths, card: action.payload.id }))
            }
        }
        console.groupEnd();
    }
});

/**
 * Listen for card removed actions and update cache subscriptions; specifically handling the case of Diff cards that might ref the removed card.
 */
startAppListening({
    actionCreator: cardRemoved,
    effect: async (action, listenerApi) => {
        const card = listenerApi.getOriginalState().cards.entities[action.payload];
        const metafile = card ? listenerApi.getState().metafiles.entities[card.metafile] : undefined;

        // handle Diff cards that contain a reference to the removed card
        const diffs = cardSelectors.selectByTarget(listenerApi.getState(), action.payload as UUID);
        diffs.map(card => listenerApi.dispatch(cardRemoved(card.id)));

        if (card && metafile && isFilebasedMetafile(metafile)) {
            let updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
            updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
            const metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
                isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [metafile.id]) : [];

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