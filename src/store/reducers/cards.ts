import { Actions, ActionKeys } from '../actions';
import { Card } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export const cardReducer = (state: { [id: string]: Card } = {}, action: Actions) => {
  switch (action.type) {
    case ActionKeys.ADD_CARD:
      return addItemInMap(state, action.card);
    case ActionKeys.REMOVE_CARD:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_CARD:
      return updateItemInMapById(state, action.id, (card => updateObject(card, action.card)));
    default:
      return state;
  }
}