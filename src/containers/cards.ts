import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import type { Card } from '../types';
import { ActionKeys, NarrowActionType } from '../store/actions';
import { HandlerRequiredMetafile } from './handlers';

type AddCardAction = NarrowActionType<ActionKeys.ADD_CARD>;
type UpdateCardAction = NarrowActionType<ActionKeys.UPDATE_CARD>;

/**
 * Action Creator for composing a valid ADD_CARD Redux Action.
 * @param metafile The related `Metafile` object containing a valid `handler` field.
 * @return An `AddCardAction` object that can be dispatched via Redux.
 */
export const addCard = (metafile: HandlerRequiredMetafile): AddCardAction => {
  const card: Card = {
    id: v4(),
    name: metafile.name,
    created: DateTime.local(),
    modified: metafile.modified,
    left: 10,
    top: 25,
    type: metafile.handler,
    metafile: metafile.id
  };
  return {
    type: ActionKeys.ADD_CARD,
    id: card.id,
    card: card
  };
}

/**
 * Action Creator for composing a valid UPDATE_CARD Redux Action. If the current Redux store does not contain a
 * matching card (based on UUID) for the passed parameter, then dispatching this action will not result in any
 * changes in the Redux store state.
 * @param card A `Card` object containing new field values to be updated.
 * @return An `UpdateCardAction` object that can be dispatched via Redux, including an updated timestamp in the
 * `modified` field.
 */
export const updateCard = (card: Card): UpdateCardAction => {
  return {
    type: ActionKeys.UPDATE_CARD,
    id: card.id,
    card: { ...card, modified: DateTime.local() }
  }
}