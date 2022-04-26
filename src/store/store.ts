import { combineReducers, configureStore } from '@reduxjs/toolkit';
import stacksReducer from './slices/stacks';
import cardsReducer from './slices/cards';
import filetypesReducer from './slices/filetypes';
import metafilesReducer from './slices/metafiles';
import cacheReducer from './slices/cache';
import reposReducer from './slices/repos';
import branchesReducer from './slices/branches';
import modalsReducer from './slices/modals';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { listenerMiddleware } from './listenerMiddleware';

export const rootReducer = combineReducers({
    stacks: stacksReducer,
    cards: cardsReducer,
    filetypes: filetypesReducer,
    metafiles: metafilesReducer,
    cache: cacheReducer,
    repos: reposReducer,
    branches: branchesReducer,
    modals: modalsReducer
});

const persistConfig = {
    key: 'root',
    storage: storage,
    version: 0,
    blacklist: ['filetypes']
}

export const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
        }
    }).concat([listenerMiddleware.middleware])
});
const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default ({ store: store, persistor: persistor });