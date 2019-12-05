import { Actions, ActionKeys } from '../actions';
import { Repository } from '../types';
import { addItemInMap, removeItemInMap, updateItemInMap, updateObject } from '../immutables';

export const reposReducer = (state: { [id: string]: Repository } = {}, action: Actions) => {
  switch (action.type) {
    case ActionKeys.ADD_REPO:
      return addItemInMap(state, action.repo);
    case ActionKeys.REMOVE_REPO:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_REPO:
      return updateItemInMap(state, action.id, (repo => updateObject(repo, action.repo)));
    default:
      return state;
  }
};