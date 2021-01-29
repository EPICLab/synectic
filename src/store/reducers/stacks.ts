import type { Stack } from '../../types';
import { Action, ActionKeys } from '../actions';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export const stackReducer = (state: { [id: string]: Stack } = {}, action: Action): { [id: string]: Stack } => {
  switch (action.type) {
    case ActionKeys.ADD_STACK:
      return addItemInMap(state, action.stack);
    case ActionKeys.REMOVE_STACK:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_STACK:
      return updateItemInMapById(state, action.id, (stack => updateObject(stack, action.stack)));
    default:
      return state;
  }
}