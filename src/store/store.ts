import { combineReducers, configureStore } from '@reduxjs/toolkit';
import stacksReducer from './slices/stacks';
import cardsReducer from './slices/cards';
import filetypesReducer from './slices/filetypes';
import metafilesReducer from './slices/metafiles';
// import cacheReducer from './slices/cache';
import reposReducer from './slices/repos';
import branchesReducer from './slices/branches';
import commitsReducer from './slices/commits';
import modalsReducer from './slices/modals';
// import {
//   FLUSH,
//   PAUSE,
//   PERSIST,
//   persistReducer,
//   persistStore,
//   PURGE,
//   REGISTER,
//   REHYDRATE
// } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';
import { listenerMiddleware } from './listenerMiddleware';
// import { createLogger } from 'redux-logger';

export const rootReducer = combineReducers({
  stacks: stacksReducer,
  cards: cardsReducer,
  filetypes: filetypesReducer,
  metafiles: metafilesReducer,
  // cache: cacheReducer,
  repos: reposReducer,
  branches: branchesReducer,
  commits: commitsReducer,
  modals: modalsReducer
});

// const persistConfig = {
//   key: 'root',
//   storage: storage,
//   version: 0,
//   blacklist: ['filetypes']
// };

// const logger = createLogger({
//   predicate: (_getState, action) =>
//     !action.type.startsWith('filetypes/') && !action.type.startsWith('persist/'),
//   duration: true,
//   collapsed: true,
//   diff: true
// });

// export const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: rootReducer,
  devTools: true,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat([listenerMiddleware.middleware /*, logger*/])
});
// const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default { store: store };
