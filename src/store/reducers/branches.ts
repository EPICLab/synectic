import { Action, ActionKeys } from '../actions';
import { Branch } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject, removeMatchesInMap } from '../immutables';

export const branchesReducer = (state: { [id: string]: Branch } = {}, action: Action): { [id: string]: Branch } => {
  switch (action.type) {
    case ActionKeys.ADD_BRANCH:
      return addItemInMap(state, action.branch);
    case ActionKeys.REMOVE_BRANCH:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_BRANCH:
      return updateItemInMapById(state, action.id, (branch => updateObject<Branch>(branch, action.branch)));
    case ActionKeys.REMOVE_REPO:
      return removeMatchesInMap(state, (branch => branch.repo === action.id));
    default:
      return state;
  }
}