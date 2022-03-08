import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { XYCoord } from 'react-dnd';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppThunkAPI } from '../hooks';
import { Stack, stackAdded, stackRemoved, stackUpdated } from '../slices/stacks';
import { removeItemInArray } from '../immutables';
import { Card, cardUpdated } from '../slices/cards';
import { isDefined } from '../../containers/format';
import { UUID } from '../types';

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
    // filter out any cards that are already captured by the stack
    const cards = param.cards.filter(card => card.captured !== param.stack.id);
    thunkAPI.dispatch(stackUpdated({
      ...param.stack,
      cards: [...param.stack.cards, ...cards.map(card => card.id)]
    }));
    cards.map((card, index) => {
      thunkAPI.dispatch(
        cardUpdated({
          ...card,
          captured: param.stack.id,
          zIndex: param.stack.cards.length + (index + 1),
          top: (10 * (param.stack.cards.length + index) + 50),
          left: (10 * (param.stack.cards.length + index) + 10)
        })
      );
    })
  }
)

/**
 * Async Thunk action creator for removing a child card contained within a stack. If the current Redux store does not contain a 
 * matching card (based on UUID), then dispatching this action will not result in any changes in the Redux store state. Positioning of 
 * the card becomes relative to the bounds of the canvas, unless no `delta` parameter is provide (in which case the card is arbitrarily
 * positioned outside of the stack).
 * @param card The `Card` object to be removed from the stack.
 * @param delta The { x, y } difference between the last recorded client offset of the pointer and the client offset when the
 * current drag operation has started (gathered from `DropTargetMonitor.getDifferenceFromInitialOffset()`).
 * @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const popCard = createAsyncThunk<void, { card: Card, delta?: XYCoord }, AppThunkAPI>(
  'stacks/popCard',
  async (param, thunkAPI) => {
    const cards = thunkAPI.getState().cards.entities;
    const stack = param.card.captured ? thunkAPI.getState().stacks.entities[param.card.captured] : undefined;
    if (stack) {
      // update the card
      thunkAPI.dispatch(cardUpdated({
        ...param.card,
        captured: undefined,
        zIndex: 0,
        left: param.delta ? stack.left + param.card.left + param.delta.x : stack.left + param.card.left + 25,
        top: param.delta ? stack.top + param.card.top + param.delta.y : stack.top + param.card.top + 25
      }));

      // update the stack
      const updatedStack = thunkAPI.dispatch(stackUpdated({
        ...stack,
        cards: removeItemInArray(stack.cards, param.card.id)
      })).payload;

      // update the other cards in the stack
      stack.cards
        .filter(id => id !== param.card.id)
        .map(id => cards[id])
        .filter(isDefined)
        .map((card, index) => {
          thunkAPI.dispatch(cardUpdated({
            ...card,
            captured: updatedStack.cards.length < 2 ? undefined : card.captured,
            zIndex: updatedStack.cards.length < 2 ? 0 : index,
            top: updatedStack.cards.length < 2 ? stack.left + card.left + 25 : 10 * index + 50,
            left: updatedStack.cards.length < 2 ? stack.top + card.top + 25 : 10 * index + 10
          }));
        });
      if (updatedStack.cards.length < 2) thunkAPI.dispatch(stackRemoved(stack.id));
    }
  }
)