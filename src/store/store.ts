import { combineReducers, configureStore } from '@reduxjs/toolkit';
import stacksReducer from './slices/stacks';
import cardsReducer from './slices/cards';
import filetypesReducer from './slices/filetypes';
import metafilesReducer from './slices/metafiles';
import reposReducer from './slices/repos';
import modalsReducer from './slices/modals';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

export const rootReducer = combineReducers({
    stacks: stacksReducer,
    cards: cardsReducer,
    filetypes: filetypesReducer,
    metafiles: metafilesReducer,
    repos: reposReducer,
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
    middleware: (getDefaultMiddleware) => [
        ...getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        }),
    ]
});
const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default ({ store: store, persistor: persistor });