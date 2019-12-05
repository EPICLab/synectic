import { combineReducers } from 'redux';
import { canvasReducer } from './reducers/canvas';
import { reposReducer } from './reducers/repos';
import { stackReducer } from './reducers/stacks';
import { cardReducer } from './reducers/cards';

export const rootReducer = combineReducers({
  canvas: canvasReducer,
  repos: reposReducer,
  stacks: stackReducer,
  cards: cardReducer
});

export type RootState = ReturnType<typeof rootReducer>;