import { Action, ActionKeys } from '../actions';
import { Repository } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject, updateMatchesInMap, removeItemInArray } from '../immutables';

export const reposReducer = (state: { [id: string]: Repository } = {}, action: Action): { [id: string]: Repository } => {
  switch (action.type) {
    case ActionKeys.ADD_REPO:
      return addItemInMap(state, action.repo);
    case ActionKeys.REMOVE_REPO:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_REPO:
      return updateItemInMapById(state, action.id, (repo => updateObject<Repository>(repo, action.repo)));
    case ActionKeys.ADD_BRANCH:
      return updateMatchesInMap(state, (repo => repo.id === action.branch.repo),
        (repo => updateObject<Repository>(repo, { ...repo, refs: [...repo.refs, action.id] })));
    case ActionKeys.REMOVE_BRANCH:
      return updateMatchesInMap(state, (repo => repo.refs.includes(action.id)),
        (repo => updateObject<Repository>(repo, { ...repo, refs: removeItemInArray(repo.refs, action.id) })));
    default:
      return state;
  }
};