import { combineReducers, configureStore } from '@reduxjs/toolkit';
import stacksReducer from './slices/stacks';
import cardsReducer from './slices/cards';
import filetypesReducer from './slices/filetypes';
import metafilesReducer from './slices/metafiles';
import reposReducer from './slices/repos';
import modalsReducer from './slices/modals';

export const rootReducer = combineReducers({
    stacks: stacksReducer,
    cards: cardsReducer,
    filetypes: filetypesReducer,
    metafiles: metafilesReducer,
    repos: reposReducer,
    modals: modalsReducer
});

const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;