import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { XYCoord } from 'react-dnd';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { UUID, Card, Stack } from '../../types';
import type { AppThunkAPI } from '../hooks';
import { stackAdded, stackRemoved, stackUpdated } from '../slices/stacks';
import { removeItemInArray } from '../immutables';
import { cardUpdated, cardRemoved } from '../slices/cards';

export const fetchStackById = createAsyncThunk<Stack | undefined, UUID, AppThunkAPI>(
  'stacks/fetchById',
  async (id, thunkAPI) => {
    return thunkAPI.getState().stacks.entities[id];
  }
);

/**
 * Async Thunk action creator for creating a new stack, appending all captured child cards, and updating state 
 * accordingly.
 * @param name Name of the new Stack object.
 * @param cards Array of at least two Card objects to be contained with the new Stack.
 * @param note (Optional) Note field related to the new Stack.
 * @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const createStack = createAsyncThunk<UUID, { name: string, cards: Card[], note?: string }, AppThunkAPI>(
  'stacks/createStack',
  async (stack, thunkAPI) => {
    const newStack = thunkAPI.dispatch(stackAdded({
      id: v4(),
      name: stack.name,
      created: DateTime.local().valueOf(),
      modified: DateTime.local().valueOf(),
      note: stack.note ? stack.note : '',
      cards: stack.cards.map(card => card.id),
      left: stack.cards[0].left,
      top: stack.cards[0].top
    }));
    stack.cards.map((card, index) => thunkAPI.dispatch(
      cardUpdated({ ...card, captured: newStack.payload.id, zIndex: index + 1, top: (10 * index + 50), left: (10 * index + 10) })
    ));
    return newStack.payload.id;
  }
)

/**
 * Async Thunk action creator for appending newly captured child cards to an existing stack. Positioning of the cards 
 * becomes relative to the bounds of the stack and order of insertion.
 * @param stack The target `Stack` object that should receive the new cards.
 * @param cards An array of `Card` objects to be added to the stack.
 * @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const pushCards = createAsyncThunk<void, { stack: Stack, cards: Card[] }, AppThunkAPI>(
  'stacks/pushCards',
  async (param, thunkAPI) => {
    thunkAPI.dispatch(stackUpdated({
      ...param.stack,
      cards: [...param.stack.cards, ...param.cards.map(card => card.id)]
    }));
    param.cards.map((card, index) => thunkAPI.dispatch(
      cardUpdated({
        ...card,
        captured: param.stack.id,
        zIndex: param.stack.cards.length + index,
        top: (10 * (param.stack.cards.length + index) + 50),
        left: (10 * (param.stack.cards.length + index) + 10)
      })
    ))
  }
)

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
 * @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const popCard = createAsyncThunk<void, { stack: Stack, card: Card, delta?: XYCoord }, AppThunkAPI>(
  'stacks/popCard',
  async (param, thunkAPI) => {
    if (param.stack.cards.length <= 2) {
      // remove the stack, and uncapture the remaining card
      const bottomCardId = param.stack.cards.find(c => c !== param.card.id);
      const bottomCard = bottomCardId ? thunkAPI.getState().cards.entities[bottomCardId] : undefined;
      if (bottomCard) thunkAPI.dispatch(cardUpdated({
        ...bottomCard,
        captured: undefined,
        left: Math.round(param.stack.left + bottomCard.left),
        top: Math.round(param.stack.top + bottomCard.top)
      }));
      thunkAPI.dispatch(stackRemoved(param.stack.id));
    } else {
      // only remove the indicated card from the stack, don't remove the stack
      thunkAPI.dispatch(stackUpdated({
        ...param.stack,
        cards: removeItemInArray(param.stack.cards, param.card.id)
      }))
      param.stack.cards
        .map(cardId => thunkAPI.getState().cards.entities[cardId])
        .filter((card): card is Card => card !== undefined)
        .map((card, index) => thunkAPI.dispatch(
          cardUpdated({
            ...card,
            captured: param.stack.id,
            zIndex: param.stack.cards.length + index,
            top: (10 * (param.stack.cards.length + index) + 50),
            left: (10 * (param.stack.cards.length + index) + 10)
          })
        ))
    }
    if (param.delta) {
      thunkAPI.dispatch(cardUpdated({
        ...param.card,
        captured: undefined,
        zIndex: 0,
        left: Math.round(param.stack.left + param.card.left + param.delta.x),
        top: Math.round(param.stack.top + param.card.top + param.delta.y)
      }));
    } else {
      thunkAPI.dispatch(cardRemoved(param.card.id));
    }
  }
)