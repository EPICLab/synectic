import { combineReducers } from 'redux';
import { canvasReducer } from './reducers/canvas';
import { stackReducer } from './reducers/stacks';
import { cardReducer } from './reducers/cards';
import { filetypeReducer } from './reducers/filetypes';
import { metafileReducer } from './reducers/metafiles';
import { repoReducer } from './reducers/repos';
import { modalReducer } from './reducers/modal';

export const rootReducer = combineReducers({
  canvas: canvasReducer,
  stacks: stackReducer,
  cards: cardReducer,
  filetypes: filetypeReducer,
  metafiles: metafileReducer,
  repos: repoReducer,
  modals: modalReducer
});

export type RootState = ReturnType<typeof rootReducer>;