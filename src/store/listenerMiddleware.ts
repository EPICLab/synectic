import {
  TypedAddListener,
  TypedStartListening,
  addListener,
  createListenerMiddleware,
  isAnyOf,
  isFulfilled,
  isRejected
} from '@reduxjs/toolkit';
import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import { isDefined } from '../containers/utils';
import cardSelectors from './selectors/cards';
import metafileSelectors from './selectors/metafiles';
import { cacheUpdated } from './slices/cache';
import { cardRemoved } from './slices/cards';
import {
  FilebasedMetafile,
  isDirectoryMetafile,
  isFileMetafile,
  isFilebasedMetafile
} from './slices/metafiles';
import { AppDispatch, RootState } from './store';
import { fetchBranches, removeBranch } from './thunks/branches';
import { unsubscribeCache } from './thunks/cache';
import { buildCard } from './thunks/cards';
import {
  switchBranch,
  updateDirectoryMetafile,
  updateFileMetafile,
  updateFilebasedMetafile,
  updateVersionedMetafile
} from './thunks/metafiles';
import { buildRepo } from './thunks/repos';

export const listenerMiddleware = createListenerMiddleware<RootState>();
export type AppStartListening = TypedStartListening<RootState, AppDispatch>;
export const startAppListening = listenerMiddleware.startListening as AppStartListening;
export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

/**
 * Listen for rejected actions and log relevant information in the console.
 */
startAppListening({
  matcher: isRejected,
  effect: action => {
    console.group(`${action.type} : ${DateTime.local().toHTTP()}`);
    console.log(`meta: `, action.meta);
    console.log(`payload: `, action.payload);
    console.log(action.error);
    console.groupEnd();
  }
});

/**
 * Listen for successful card build actions and update additional metafile fields (filebased and versioned), and cache subscriptions.
 *
 * This listener handles updating descendants instead of offloading that task to a listener for {@link createMetafile} events, since that
 * event has the potential to lead to excessive calls to {@link updateFilebasedMetafile} and {@link updateVersionedMetafile} for all descendants
 * instead of only updating direct children (and delaying updating deeper descendants until necessary).
 */
startAppListening({
  matcher: isAnyOf(buildCard.fulfilled, switchBranch.fulfilled),
  effect: async (action, listenerApi) => {
    const metafile = isFulfilled(buildCard)(action)
      ? listenerApi.getState().metafiles.entities[action.payload.metafile]
      : isFulfilled(switchBranch)(action)
      ? action.payload
      : undefined;

    if (isFilebasedMetafile(metafile)) {
      // update filebased fields
      const updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
      const descendants = isDirectoryMetafile(updated)
        ? metafileSelectors
            .selectByIds(listenerApi.getState(), updated.contains)
            .filter(isFilebasedMetafile)
        : [];
      const directories: FilebasedMetafile[] = [];
      const files: FilebasedMetafile[] = [];
      descendants.map(desc =>
        desc.filetype === 'Directory' ? directories.push(desc) : files.push(desc)
      );
      await Promise.allSettled(
        directories.map(
          async desc => await listenerApi.dispatch(updateDirectoryMetafile(desc)).unwrap()
        )
      );
      await Promise.allSettled(
        files.map(async desc => await listenerApi.dispatch(updateFileMetafile(desc)).unwrap())
      );

      console.error(`Updating versioned metafile for ${metafile.name}`);

      await listenerApi.dispatch(updateVersionedMetafile(metafile));
      console.error(`Updating versioned metafiles (${descendants.length} descendants)`);
      // const b = await Promise.allSettled(descendants.map(async desc => await listenerApi.dispatch(updateVersionedMetafile(desc)).unwrap()));
      // const bRejected = b.filter(res => res.status === 'rejected');
      // console.error(`Updated versioned metafiles (${start.diffNow().as('milliseconds')} ms, avg: 2368-3342 ms)`, { bRejected });

      // // add cache subscriptions for current metafile (and descendants)
      // const descendantsUpdated = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains).filter(isFilebasedMetafile) : [];
      // await listenerApi.dispatch(subscribeAll({ paths: [metafile, ...descendantsUpdated].filter(isFileMetafile).map(m => m.path), card: action.payload.id }));
    }
    // if (isFulfilled(switchBranch)(action)) {
    //     // remove cache subscriptions for previous metafile (and descendants)
    //     const prevMetafile = listenerApi.getState().metafiles.entities[action.meta.arg.metafileId];
    //     if (isFilebasedMetafile(prevMetafile)) {
    //         const prevDescendants = isDirectoryMetafile(prevMetafile) ? metafileSelectors.selectByIds(listenerApi.getState(), prevMetafile.contains).filter(isFilebasedMetafile) : [];
    //         await listenerApi.dispatch(unsubscribeAll({ paths: [prevMetafile, ...prevDescendants].filter(isFileMetafile).map(m => m.path), card: action.meta.arg.cardId }));
    //     }
    // }
  }
});

// /**
//  * Listen for branch switching actions and toggle `checkout` flag to indicate in-progress and completed actions.
//  */
// startAppListening({
//     matcher: isAnyOf(switchBranch.pending, switchBranch.fulfilled, switchBranch.rejected),
//     effect: (action, listenerApi) => {
//         if (isPending(switchBranch)(action)) {
//             console.log(`LISTENER: ${action.type} for metafile: ${action.meta.arg.metafileId}, ref: ${action.meta.arg.ref}, root: ${action.meta.arg.root}`);
//             const branch = branchSelectors.selectByRef(listenerApi.getState(), action.meta.arg.ref)[0];
//             const metafiles = branch ? metafileSelectors.selectByBranch(listenerApi.getState(), branch.id, action.meta.arg.root) : [];
//             metafiles
//                 .filter(metafile => metafile.flags.every(flag => flag !== 'checkout'))
//                 .map(metafile => listenerApi.dispatch(metafileUpdated({ ...metafile, flags: [...metafile.flags, 'checkout'] })));
//         }
//         if (isFulfilled(switchBranch)(action) || isRejected(switchBranch)(action)) {
//             console.log(`LISTENER: ${action.type} for metafile: ${action.meta.arg.metafileId}, ref: ${action.meta.arg.ref}, root: ${action.meta.arg.root}`);
//             const branch = branchSelectors.selectByRef(listenerApi.getState(), action.meta.arg.ref)[0];
//             const metafiles = branch ? metafileSelectors.selectByBranch(listenerApi.getState(), branch.id, action.meta.arg.root) : [];
//             metafiles
//                 .map(metafile => listenerApi.dispatch(metafileUpdated({ ...metafile, flags: metafile.flags.filter(flag => flag !== 'checkout') })));
//         }
//     }
// });

/**
 * Listen for cache update actions and update additional metafile fields (filebased and versioned) as needed to synchronize with filesystem.
 */
startAppListening({
  actionCreator: cacheUpdated,
  effect: async (action, listenerApi) => {
    const payload = action.payload;
    console.log(`LISTENER: ${action.type} for cache: ${action.payload.path}\n`, { payload });

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
 * Listen for card removed actions and update cache subscriptions; also handle the case of Diff cards that might reference the removed card.
 */
startAppListening({
  actionCreator: cardRemoved,
  effect: async (action, listenerApi) => {
    const card = listenerApi.getOriginalState().cards.entities[action.payload];
    const metafile = card ? listenerApi.getState().metafiles.entities[card.metafile] : undefined;
    console.log(
      `LISTENER: ${action.type} for card: ${card?.id} - ${card?.name}, metafile: ${metafile?.id} - ${metafile?.name}\n`,
      { card, metafile }
    );

    // handle Diff cards that contain a reference to the removed card
    const diffs = cardSelectors.selectByTarget(listenerApi.getState(), action.payload.toString());
    diffs.map(card => listenerApi.dispatch(cardRemoved(card.id)));

    if (isDefined(card) && isFilebasedMetafile(metafile)) {
      // const selectByIds = metafileSelectors.makeSelectByIds();
      const descendants = isDirectoryMetafile(metafile)
        ? metafileSelectors
            .selectByIds(listenerApi.getState(), metafile.contains)
            .filter(isFilebasedMetafile)
        : [];
      await Promise.all(
        [metafile, ...descendants].map(
          async metafile =>
            await listenerApi.dispatch(
              unsubscribeCache({
                path: metafile.path,
                card: card.id
              })
            )
        )
      );
    }
  }
});

startAppListening({
  actionCreator: buildRepo.fulfilled,
  effect: async (action, listenerApi) => {
    const repo = action.payload;
    console.log(`hello from ${repo.name}`);
    const branches = await listenerApi.dispatch(fetchBranches(repo.root)).unwrap();
    console.error(`LISTENER: branches`, { branches });
    // const { local, remote } = { local: branches.local.map(branch => branch.id), remote: branches.remote.map(branch => branch.id) };
    // if (hasUpdates(repo, { local, remote })) listenerApi.dispatch(repoUpdated({
    //     ...repo,
    //     local: local,
    //     remote: remote
    // }));
  }
});

/**
 * Listen for metafile update actions and toggle `updating` flag to indicate in-progress and completed actions.
 */
// startAppListening({
//     matcher: isAnyOf(updateFileMetafile.pending, updateVersionedMetafile.pending, updateFileMetafile.fulfilled, updateVersionedMetafile.fulfilled, updateFileMetafile.rejected, updateVersionedMetafile.rejected),
//     effect: (action, listenerApi) => {
//         if (isPending(updateFileMetafile, updateVersionedMetafile)(action) && action.meta.arg.flags.every(flag => flag !== 'updating')) {
//             listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, flags: [...action.meta.arg.flags, 'updating'] }));
//         }
//         if (isFulfilled(updateFileMetafile, updateVersionedMetafile)(action)) {
//             listenerApi.dispatch(metafileUpdated({ ...action.payload, flags: action.meta.arg.flags.filter(flag => flag !== 'updating') }));
//         }
//         if (isRejected(updateFileMetafile, updateVersionedMetafile)(action)) {
//             listenerApi.dispatch(metafileUpdated({ ...action.meta.arg, flags: action.meta.arg.flags.filter(flag => flag !== 'updating') }));
//         }
//     }
// });

/**
 * Listen for branch removal actions and remove any cards that reference the branch.
 */
startAppListening({
  actionCreator: removeBranch.fulfilled,
  effect: async (action, listenerApi) => {
    console.log(
      `LISTENER: ${action.type} for repo: ${action.meta.arg.repoId}, branch: ${action.meta.arg.branch.id} = ${action.meta.arg.branch.ref}\n`,
      { action }
    );
    if (action.payload === true) {
      const cards = cardSelectors.selectByRepo(
        listenerApi.getState(),
        action.meta.arg.repoId,
        action.meta.arg.branch.id
      );
      cards.map(card => listenerApi.dispatch(cardRemoved(card.id)));
    }
  }
});

// startAppListening({
//     actionCreator: cardUpdated,
//     effect: (action) => {
//         const payload = action.payload;
//         console.log(`LISTENER: ${action.type} for card: ${action.payload.id} - ${action.payload.name}\n`, { payload });
//     }
// });

/**
 * Listen for card update actions and update cache subscriptions.
 */
// startAppListening({
//     actionCreator: cardUpdated,
//     effect: async (action, listenerApi) => {
//         const prevCard = listenerApi.getOriginalState().cards.entities[action.payload.id];

//         // if there is a previous metafile, then we might need to update subscriptions
//         if (prevCard?.metafile) {
//             const previous = listenerApi.getOriginalState().metafiles.entities[prevCard.metafile];
//             const current = listenerApi.getState().metafiles.entities[action.payload.metafile];

//             if (previous && current && previous.id != current.id) { // handle when previous and current metafile differ (e.g. 'metafiles/switchBranch')
//                 if (isFilebasedMetafile(previous)) { // unsubscribe from the previous metafile
//                     await listenerApi.dispatch(unsubscribe({ path: previous.path.toString(), card: action.payload.id }));
//                 }

//                 if (isFilebasedMetafile(current)) { // subscribe to the current metafile
//                     // let updated = await listenerApi.dispatch(updateFilebasedMetafile(current)).unwrap();
//                     let updated = current;
//                     updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
//                     const metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
//                         isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [current.id]) : [];
//                     const paths = metafiles.filter(isFileMetafile).map(m => m.path);
//                     listenerApi.dispatch(subscribeAll({ paths: paths, card: action.payload.id }));
//                 }
//             }
//         }

//         // if no previous metafile, then check for a current metafile and subscribe to it
//         if (!prevCard || !prevCard.metafile) {
//             const metafile = listenerApi.getState().metafiles.entities[action.payload.metafile];

//             if (metafile && isFilebasedMetafile(metafile)) {
//                 // let updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();
//                 let updated = metafile;
//                 updated = await listenerApi.dispatch(updateVersionedMetafile(updated)).unwrap();
//                 const metafiles = isDirectoryMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), updated.contains) :
//                     isFileMetafile(updated) ? metafileSelectors.selectByIds(listenerApi.getState(), [metafile.id]) : [];
//                 const paths = metafiles.filter(isFileMetafile).map(m => m.path);
//                 listenerApi.dispatch(subscribeAll({ paths: paths, card: action.payload.id }))
//             }
//         }
//         console.groupEnd();
//     }
// });
