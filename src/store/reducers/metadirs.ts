import { Actions, ActionKeys } from '../actions';
import { Metadir } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export const metaDirReducer = (state: { [id: string]: Metadir } = {}, action: Actions) => {
    switch (action.type) {
        case ActionKeys.ADD_FE:
            return addItemInMap(state, action.metadir);
        case ActionKeys.REMOVE_FE:
            return removeItemInMap(state, action.id);
        case ActionKeys.UPDATE_FE:
            return updateItemInMapById(state, action.id, (metadir => updateObject<Metadir>(metadir, action.metadir)));
        default:
            return state;
    }
}