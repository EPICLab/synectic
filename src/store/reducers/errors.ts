import { Action, ActionKeys } from '../actions';
import { Error } from '../../types';
import { addItemInMap, removeItemInMap } from '../immutables';

export const errorReducer = (state: { [id: string]: Error } = {}, action: Action) => {
  switch (action.type) {
    case ActionKeys.ADD_ERROR:
      return addItemInMap(state, action.error);
    case ActionKeys.REMOVE_ERROR:
      return removeItemInMap(state, action.id);
    default:
      return state;
  }
}