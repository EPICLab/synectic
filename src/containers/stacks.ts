import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import type { Card, Stack } from '../types';
import { Action, ActionKeys, NarrowActionType } from '../store/actions';
import { updateCard } from './cards';
import { removeItemInArray } from '../store/immutables';
import { XYCoord } from 'react-dnd';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store/root';

type AddStackAction = NarrowActionType<ActionKeys.ADD_STACK>;
type UpdateStackAction = NarrowActionType<ActionKeys.UPDATE_STACK>;
type RemoveStackAction = NarrowActionType<ActionKeys.REMOVE_STACK>;
type UpdateCardAction = NarrowActionType<ActionKeys.UPDATE_CARD>;
type RemoveCardAction = NarrowActionType<ActionKeys.REMOVE_CARD>;
type RemoveMinStackActions = (UpdateStackAction | RemoveStackAction | UpdateCardAction | RemoveCardAction)[];

/**
 * Action Creator for composing a valid ADD_STACK Redux Action, which requires additional UPDATE_CARD Redux Actions for updating all 
 * child cards captured within the new Stack.
 * @param name Name of the new Stack object.
 * @param cards Array of at least two Card objects to be contained with the new Stack.
 * @param note (Optional) Note field related to the new Stack.
 * @return An array of `AddStackAction` and `UpdateCardAction` objects that can be dispatched via Redux.
 */
export const addStack = (name: string, cards: Card[], note?: string): (AddStackAction | UpdateCardAction)[] => {
  const stack: Stack = {
    id: v4(),
    name: name,
    created: DateTime.local(),
    modified: DateTime.local(),
    note: note ? note : '',
    cards: cards.map(card => card.id),
    left: cards[0].left,
    top: cards[0].top
  };
  const actions: (AddStackAction | UpdateCardAction)[] = [{ type: ActionKeys.ADD_STACK, id: stack.id, stack: stack }];
  cards.map((card, index) => actions.push(updateCard({ ...card, captured: stack.id, top: (10 * index + 50), left: (10 * index + 10) })));
  return actions;
}

/**
 * Action Creator for composing a valid UPDATE_STACK Redux Action. If the current Redux store does not contain a matching stack 
 * (based on UUID) for the passed parameter, then dispatching this action will not result in any changes in the Redux store state.
 * @param stack A `Stack` object containing new field values to be updated.
 * @return An `UpdateStackAction` object that can be dispatched via Redux, including an updated timestamp in the `modified` field.
 */
export const updateStack = (stack: Stack): UpdateStackAction => {
  return {
    type: ActionKeys.UPDATE_STACK,
    id: stack.id,
    stack: { ...stack, modified: DateTime.local() }
  };
};

/**
 * Action Creator for composing a valid UPDATE_STACK and UPDATE_CARD Redux actions for capturing child cards and appending them to be
 * contained within a stack. Positioning of the cards becomes relative to the bounds of the stack and order of insertion.
 * @param stack The target `Stack` object that should receive the new cards.
 * @param cards An array of `Card` objects to be added to the stack.
 * @return An array of `UpdateStackAction` and `UpdateCardAction` objects that can be dispatched via Redux.
 */
export const pushCards = (stack: Stack, cards: Card[]): (UpdateStackAction | UpdateCardAction)[] => {
  return [
    updateStack({ ...stack, cards: [...stack.cards, ...cards.map(card => card.id)] }),
    ...cards.map((card, index) => updateCard({
      ...card,
      captured: stack.id,
      top: (10 * (stack.cards.length + index) + 50),
      left: (10 * (stack.cards.length + index) + 10)
    }))
  ];
}

/**
 * Thunk Action Creator for composing valid UPDATE_STACK, REMOVE_STACK, UPDATE_CARD, and REMOVE_CARD Redux actions for removing a child 
 * card contained  within a stack. If the current Redux store does not contain a matching card (based on UUID) contained in the stack 
 * passed as a parameter, then dispatching this action will not result in any changes in the Redux store state. Positioning of the 
 * card becomes relative to the bounds of the canvas, unless no `delta` parameter is provide (in which case the card is deleted from 
 * the Redux store as well as from the stack).
 * @param stack The target `Stack` object that contains the card to be removed.
 * @param card The `Card` object to be removed from the stack.
 * @param delta The { x, y } difference between the last recorded client offset of the pointer and the client offset when the
 * current drag operation has started (gathered from `DropTargetMonitor.getDifferenceFromInitialOffset()`); if undefined, then the 
 * card will be removed from the Redux state as well as from the stack.
 * @return A Thunk that can be executed to read Redux state and dispatch Redux updates for removing a card from a stack.
 */
export const popCard = (stack: Stack, card: Card, delta?: XYCoord): ThunkAction<RemoveMinStackActions, RootState, undefined, Action> =>
  (dispatch, getState) => {
    const actions: RemoveMinStackActions = [];
    if (stack.cards.length <= 2) {
      // remove the stack, and update all related cards
      actions.push({ type: ActionKeys.REMOVE_STACK, id: stack.id });
      const bottomCardId = stack.cards.find(c => c !== card.id);
      const bottomCard = bottomCardId ? getState().cards[bottomCardId] : undefined;
      if (bottomCard) actions.push(updateCard({
        ...bottomCard,
        captured: undefined,
        left: Math.round(stack.left + bottomCard.left),
        top: Math.round(stack.top + bottomCard.top)
      }));
    } else {
      // only remove the item from the stack, don't remove the stack
      actions.push(updateStack({ ...stack, cards: removeItemInArray(stack.cards, card.id) }));
    }
    if (delta) {
      actions.push(updateCard({
        ...card,
        captured: undefined,
        left: Math.round(stack.left + card.left + delta.x),
        top: Math.round(stack.top + card.top + delta.y)
      }));
    } else {
      actions.push({ type: ActionKeys.REMOVE_CARD, id: card.id });
    }
    return actions.map(action => dispatch(action));
  };
