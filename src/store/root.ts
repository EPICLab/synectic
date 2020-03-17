import { combineReducers } from 'redux';
import { canvasReducer } from './reducers/canvas';
import { stackReducer } from './reducers/stacks';
import { cardReducer } from './reducers/cards';
import { filetypeReducer } from './reducers/filetypes';
import { metafileReducer } from './reducers/metafiles';
import { reposReducer } from './reducers/repos';
import { metaDirReducer } from './reducers/metadirs';

export const rootReducer = combineReducers({
  canvas: canvasReducer,
  stacks: stackReducer,
  cards: cardReducer,
  filetypes: filetypeReducer,
  metafiles: metafileReducer,
  metadirs: metaDirReducer,
  repos: reposReducer
});

export type RootState = ReturnType<typeof rootReducer>;