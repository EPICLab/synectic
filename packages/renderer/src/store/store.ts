import {combineReducers, configureStore} from '@reduxjs/toolkit';
import branchesReducer from './slices/branches';
import cardsReducer from './slices/cards';
import commitsReducer from './slices/commits';
import filetypesReducer from './slices/filetypes';
import metafilesReducer from './slices/metafiles';
import modalsReducer from './slices/modals';
import reposReducer from './slices/repos';
import stacksReducer from './slices/stacks';
import {listenerMiddleware} from './listenerMiddleware';

export const rootReducer = combineReducers({
  branches: branchesReducer,
  cards: cardsReducer,
  commits: commitsReducer,
  filetypes: filetypesReducer,
  metafiles: metafilesReducer,
  modals: modalsReducer,
  repos: reposReducer,
  stacks: stacksReducer,
});

const store = configureStore({
  reducer: rootReducer,
  devTools: true,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat([listenerMiddleware.middleware]),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default {store: store};
