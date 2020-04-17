import { Browser } from '../../types';
import { Actions, ActionKeys } from '../actions';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export const browserReducer = (state: { [id: string]: Browser } = {}, action: Actions) => {
    switch (action.type) {
        case ActionKeys.ADD_BROWSER:
            return addItemInMap(state, action.browser);
        case ActionKeys.REMOVE_BROWSER:
            return removeItemInMap(state, action.id);
        case ActionKeys.UPDATE_BROWSER:
            return updateItemInMapById(state, action.id, (browser => updateObject<Browser>(browser, action.browser)));
        default:
            return state;
    }
}