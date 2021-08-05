import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { XYCoord } from 'react-dnd';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { UUID, Card, Stack } from '../types';
import type { AppThunkAPI } from '../store/store';
import { addStack, removeStack, updateStack } from '../store/slices/stacks';
import { removeCard, updateCard } from '../store/slices/cards';
import { removeItemInArray } from '../store/immutables';

/**
 * Async Thunk action creator for creating a new stack, appending all captured child cards, and updating state 
 * accordingly.
 * @param name Name of the new Stack object.
 * @param cards Array of at least two Card objects to be contained with the new Stack.
 * @param note (Optional) Note field related to the new Stack.
 * @return A Thunk that can be executed to dispatch Redux updates for creating a new stack and updating cards.
 * Updated are wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const createStack = createAsyncThunk<UUID, { name: string, cards: Card[], note?: string }, AppThunkAPI>(
  'stacks/createStack',
  async (stack, thunkAPI) => {
    const newStack = thunkAPI.dispatch(addStack({
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
      updateCard({
        id: card.id,
        card: { ...card, captured: newStack.payload.id, top: (10 * index + 50), left: (10 * index + 10) }
      })
    ));
    return newStack.payload.id;
  }
)

/**
 * Async Thunk action creator for appending newly captured child cards to an existing stack. Positioning of the cards 
 * becomes relative to the bounds of the stack and order of insertion.
 * @param stack The target `Stack` object that should receive the new cards.
 * @param cards An array of `Card` objects to be added to the stack.
 * @return A Thunk that can be executed to dispatch Redux updates for updating the stack and cards.
 * Updated are wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const pushCards = createAsyncThunk<void, { stack: Stack, cards: Card[] }, AppThunkAPI>(
  'stacks/pushCards',
  async (payload, thunkAPI) => {
    thunkAPI.dispatch(updateStack({
      id: payload.stack.id,
      stack: { ...payload.stack, cards: [...payload.stack.cards, ...payload.cards.map(card => card.id)] }
    }));
    payload.cards.map((card, index) => thunkAPI.dispatch(
      updateCard({
        id: card.id,
        card: {
          ...card,
          captured: payload.stack.id,
          top: (10 * (payload.stack.cards.length + index) + 50),
          left: (10 * (payload.stack.cards.length + index) + 10)
        }
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
 * @return A Thunk that can be executed to read Redux state and dispatch Redux updates for removing a card from a stack.
 */
export const popCard = createAsyncThunk<void, { stack: Stack, card: Card, delta?: XYCoord }, AppThunkAPI>(
  'stacks/popCard',
  async (payload, thunkAPI) => {
    if (payload.stack.cards.length <= 2) {
      // remove the stack, and uncapture the remaining card
      const bottomCardId = payload.stack.cards.find(c => c !== payload.card.id);
      const bottomCard = bottomCardId ? thunkAPI.getState().cards[bottomCardId] : undefined;
      if (bottomCard) thunkAPI.dispatch(updateCard({
        id: bottomCard.id,
        card: {
          ...bottomCard,
          captured: undefined,
          left: Math.round(payload.stack.left + bottomCard.left),
          top: Math.round(payload.stack.top + bottomCard.top)
        }
      }));
      thunkAPI.dispatch(removeStack(payload.stack.id));
    } else {
      // only remove the indicated card from the stack, don't remove the stack
      thunkAPI.dispatch(updateStack({
        id: payload.stack.id,
        stack: {
          ...payload.stack,
          cards: removeItemInArray(payload.stack.cards, payload.card.id)
        }
      }))
    }
    if (payload.delta) {
      thunkAPI.dispatch(updateCard({
        id: payload.card.id,
        card: {
          ...payload.card,
          captured: undefined,
          left: Math.round(payload.stack.left + payload.card.left + payload.delta.x),
          top: Math.round(payload.stack.top + payload.card.top + payload.delta.y)
        }
      }));
    } else {
      thunkAPI.dispatch(removeCard(payload.card.id));
    }
  }
)