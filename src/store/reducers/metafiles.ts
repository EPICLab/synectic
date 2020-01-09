import { Actions, ActionKeys } from '../actions';
import { Metafile } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject, updateMatchesInMap } from '../immutables';

export const metafileReducer = (state: { [id: string]: Metafile } = {}, action: Actions) => {
  switch (action.type) {
    case ActionKeys.ADD_METAFILE:
      return addItemInMap(state, action.metafile);
    case ActionKeys.REMOVE_METAFILE:
      return removeItemInMap(state, action.id);
    case ActionKeys.UPDATE_METAFILE:
      return updateItemInMapById(state, action.id, (metafile => updateObject<Metafile>(metafile, action.metafile)));
    case ActionKeys.REMOVE_REPO:
      return updateMatchesInMap(state, (metafile => metafile.repo === action.id),
        (metafile => updateObject<Metafile>(metafile, { ...metafile, repo: null })));
    default:
      return state;
  }
}