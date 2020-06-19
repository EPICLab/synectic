import { Action, ActionKeys } from '../actions';
import { Repository } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export const reposReducer = (state: { [id: string]: Repository } = {}, action: Action) => {
  switch (action.type) {
    case ActionKeys.ADD_REPO:
      return addItemInMap(state, action.repo);
    case ActionKeys.REMOVE_REPO:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_REPO:
      return updateItemInMapById(state, action.id, (repo => updateObject<Repository>(repo, action.repo)));
    default:
      return state;
  }
};