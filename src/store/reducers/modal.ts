import type { Modal } from '../../types';
import { Action, ActionKeys } from '../actions';
import { addItemInMap, removeItemInMap } from '../immutables';

export const modalReducer = (state: { [id: string]: Modal } = {}, action: Action): { [id: string]: Modal } => {
  switch (action.type) {
    case ActionKeys.ADD_MODAL: {
      return addItemInMap(state, action.modal);
    }
    case ActionKeys.REMOVE_MODAL: {
      return removeItemInMap(state, action.id);
    }
    default:
      return state;
  }
}