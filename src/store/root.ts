import { combineReducers } from 'redux';
import { canvasReducer } from './reducers/canvas';
import { stackReducer } from './reducers/stacks';
import { cardReducer } from './reducers/cards';
import { filetypeReducer } from './reducers/filetypes';
import { metafileReducer } from './reducers/metafiles';
import { reposReducer } from './reducers/repos';
import { errorReducer } from './reducers/errors';

export const rootReducer = combineReducers({
  canvas: canvasReducer,
  stacks: stackReducer,
  cards: cardReducer,
  filetypes: filetypeReducer,
  metafiles: metafileReducer,
  repos: reposReducer,
  errors: errorReducer
});

export type RootState = ReturnType<typeof rootReducer>;