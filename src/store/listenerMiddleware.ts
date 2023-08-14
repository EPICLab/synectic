import {
  TypedAddListener,
  TypedStartListening,
  addListener,
  createListenerMiddleware,
  isAnyOf,
  isFulfilled,
  isRejected
} from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { partition } from '../containers/utils';
import metafileSelectors from './selectors/metafiles';
import { isDirectoryMetafile, isFilebasedMetafile } from './slices/metafiles';
import { AppDispatch, RootState } from './store';
import { createCard } from './thunks/cards';
import {
  createMetafile,
  fetchParentMetafile,
  saveFile,
  switchBranch,
  updateDirectoryMetafile,
  updateFileMetafile,
  updateFilebasedMetafile,
  updateVersionedMetafile
} from './thunks/metafiles';

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
    console.groupCollapsed(
      `%c${action.type} : ${DateTime.local().toHTTP()}`,
      'background: lightcoral; color: #444; padding: 3px; border-radius: 5px;'
    );
    console.log(`meta: `, action.meta);
    console.log(`payload: `, action.payload);
    console.log(action.error);
    console.groupEnd();
  }
});

// startAppListening({
//   matcher: isFulfilled,
//   effect: action => {
//     console.groupCollapsed(
//       `%c${action.type} : ${DateTime.local().toHTTP()}`,
//       'background: lightgreen; color: #444; padding: 3px; border-radius: 5px;'
//     );
//     console.log(`meta: `, action.meta);
//     console.log(`payload: `, action.payload);
//     console.groupEnd();
//   }
// });

/**
 * Listen for successful file save actions and update any parent metafiles (filebased and versioned).
 */
startAppListening({
  actionCreator: saveFile.fulfilled,
  effect: async (action, listenerApi) => {
    const metafile = metafileSelectors.selectById(listenerApi.getState(), action.meta.arg.id);
    const parent = isFilebasedMetafile(metafile)
      ? await listenerApi.dispatch(fetchParentMetafile(metafile)).unwrap()
      : undefined;
    if (parent) await listenerApi.dispatch(updateVersionedMetafile(parent.id));
  }
});

/**
 * Listen for successful card build actions and update additional metafile fields (filebased and
 * versioned). This listener handles updating descendants instead of offloading that task to a
 * listener for {@link createMetafile} events, since that event has the potential to lead to
 * excessively recursive calls to {@link updateFilebasedMetafile} and {@link updateVersionedMetafile}
 * for all descendants. Instead, this listener only updates direct children and delays updates to
 * deeper descendants until necessary (i.e. during directory expansion in `Explorer` cards).
 */
startAppListening({
  matcher: isAnyOf(createCard.fulfilled, switchBranch.fulfilled),
  effect: async (action, listenerApi) => {
    const card = isFulfilled(createCard)(action)
      ? listenerApi.getState().cards.entities[action.payload]
      : undefined;

    const metafile = isFulfilled(switchBranch)(action)
      ? action.payload
        ? listenerApi.getState().metafiles.entities[action.payload.id]
        : undefined
      : isFulfilled(createCard)(action) && card
      ? listenerApi.getState().metafiles.entities[card.metafile]
      : undefined;

    if (isFilebasedMetafile(metafile)) {
      // update filebased fields
      const updateFilebasedTask = listenerApi.fork(async () => {
        const updated = await listenerApi.dispatch(updateFilebasedMetafile(metafile)).unwrap();

        const descendants = isDirectoryMetafile(updated)
          ? metafileSelectors
              .selectByIds(listenerApi.getState(), updated.contains)
              .filter(isFilebasedMetafile)
          : [];
        const [directories, files] = partition(
          descendants,
          descendant => descendant.filetype === 'Directory'
        );
        await Promise.allSettled(
          directories.map(
            async desc => await listenerApi.dispatch(updateDirectoryMetafile({ id: desc.id }))
          )
        );
        await Promise.allSettled(
          files.map(async desc => await listenerApi.dispatch(updateFileMetafile(desc.id)))
        );

        await listenerApi.dispatch(updateVersionedMetafile(metafile.id));
        return `directories: ${directories.length}, files: ${files.length}`;
      });

      console.log(`executing tasks...`);
      const result = await updateFilebasedTask.result;
      console.log(`Child ${result.status}: ${result.status === 'ok' ? result.value : ''}`);
    }
  }
});

// startAppListening({
//   actionCreator:
// });
