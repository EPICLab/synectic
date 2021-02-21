import { combineReducers } from 'redux';
import { canvasReducer } from './reducers/canvas';
import { stackReducer } from './reducers/stacks';
import { cardReducer } from './reducers/cards';
import { filetypeReducer } from './reducers/filetypes';
import { metafileReducer } from './reducers/metafiles';
import { repoReducer } from './reducers/repos';
import { errorReducer } from './reducers/errors';

/**
 * TODO: Experiment with setting the reducer outputs to Readonly<> to see if doing so will allow the TypeScript type
 * checker to catch usages where this type modifier is violated; i.e. when changes to state are not handled through
 * immutable operations and Redux actions.
 */

export const rootReducer = combineReducers({
  canvas: canvasReducer,
  stacks: stackReducer,
  cards: cardReducer,
  filetypes: filetypeReducer,
  metafiles: metafileReducer,
  repos: repoReducer,
  errors: errorReducer
});

export type RootState = ReturnType<typeof rootReducer>;