import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { Canvas } from '../../types';
import { Action, ActionKeys } from '../actions';
import { addItemInArray, removeItemInArray } from '../immutables';

const initialState: Canvas = {
  id: v4(),
  created: DateTime.local(),
  repos: [],
  cards: [],
  stacks: []
}

export const canvasReducer = (state: Canvas = initialState, action: Action): Canvas => {
  switch (action.type) {
    case (ActionKeys.ADD_REPO):
      return {
        ...state,
        repos: addItemInArray(state.repos, action.id)
      };
    case (ActionKeys.REMOVE_REPO):
      return {
        ...state,
        repos: removeItemInArray(state.repos, action.id)
      }
    case (ActionKeys.ADD_CARD):
      return {
        ...state,
        cards: addItemInArray(state.cards, action.id)
      };
    case (ActionKeys.REMOVE_CARD):
      return {
        ...state,
        cards: removeItemInArray(state.cards, action.id)
      };
    case (ActionKeys.ADD_STACK):
      return {
        ...state,
        stacks: addItemInArray(state.stacks, action.id)
      };
    case (ActionKeys.REMOVE_STACK):
      return {
        ...state,
        stacks: removeItemInArray(state.stacks, action.id)
      };
    default:
      return state;
  }
};