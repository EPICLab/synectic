import { XYCoord } from 'react-dnd';
import { DateTime } from 'luxon';
import { randomUUID } from 'crypto';
import { Stack, stackAdded, stackRemoved, stackUpdated } from '../slices/stacks';
import { cardUpdated } from '../slices/cards';
import { UUID } from '../types';
import { createAppAsyncThunk } from '../hooks';
import cardSelectors from '../selectors/cards';
import stackSelectors from '../selectors/stacks';

export const createStack = createAppAsyncThunk<
  Stack,
  { name: string; note: string; cards: UUID[] }
>('stacks/createStack', async (input, thunkAPI) => {
  const cards = cardSelectors.selectByIds(thunkAPI.getState(), input.cards);

  const newStack = thunkAPI.dispatch(
    stackAdded({
      id: randomUUID(),
      name: input.name,
      created: DateTime.local().valueOf(),
      modified: DateTime.local().valueOf(),
      note: input.note,
      cards: input.cards,
      left: cards[0] ? cards[0].left : 0,
      top: cards[0] ? cards[0].top : 0
    })
  ).payload;
  cards.map((card, index) =>
    thunkAPI.dispatch(
      cardUpdated({
        ...card,
        captured: newStack.id,
        zIndex: index + 1,
        top: 10 * index + 50,
        left: 10 * index + 10
      })
    )
  );
  return newStack;
});

/** Add cards to an existing Stack object. */
export const pushCards = createAppAsyncThunk<void, { stack: UUID; cards: UUID[] }>(
  'stacks/pushCards',
  async (input, thunkAPI) => {
    const state = thunkAPI.getState();
    const stack = stackSelectors.selectById(state, input.stack);
    const cards = cardSelectors.selectByIds(state, input.cards);
    if (stack && cards.length > 0) {
      const updated = thunkAPI.dispatch(
        stackUpdated({
          ...stack,
          cards: [...stack.cards, ...input.cards]
        })
      ).payload;

      // filter out any cards that are already captured by the stack
      cards
        .filter(c => c.captured !== input.stack)
        .map((card, index) => {
          thunkAPI.dispatch(
            cardUpdated({
              ...card,
              captured: updated.id,
              zIndex: updated.cards.length + (index + 1),
              top: 10 * (updated.cards.length + index) + 50,
              left: 10 * (updated.cards.length + index) + 10
            })
          );
        });
    }
  }
);

/**
 * Remove cards from an existing Stack object. Positioning of the card becomes relative to the bounds of the canvas, unless no `delta`
 * parameter is provide (in which case the card is arbitrarily positioned outside of the stack). If the `delta` parameter used, then the
 * `{x,y}` values can be gathered from `DropTargetMonitor.getDifferenceFromInitialOffset()`.
 */
export const popCards = createAppAsyncThunk<void, { cards: UUID[]; delta?: XYCoord }>(
  'stacks/pushCards',
  async (input, thunkAPI) => {
    const state = thunkAPI.getState();
    const removingCards = cardSelectors.selectByIds(state, input.cards);
    const stack = stackSelectors.selectById(
      state,
      removingCards[0]?.captured ? removingCards[0].captured : ''
    );
    if (stack) {
      // update the cards targetted for removal
      removingCards.map(card =>
        thunkAPI.dispatch(
          cardUpdated({
            ...card,
            captured: undefined,
            zIndex: 1,
            left: input.delta
              ? stack.left + card.left + input.delta.x
              : stack.left + card.left + 25,
            top: input.delta ? stack.top + card.top + input.delta.y : stack.top + card.top + 25
          })
        )
      );
      // update the stack
      const remainingCards = cardSelectors.selectByIds(
        state,
        stack.cards.filter(id => !input.cards.some(c => c === id))
      );
      const updated = thunkAPI.dispatch(
        stackUpdated({
          ...stack,
          cards: remainingCards.map(c => c.id)
        })
      ).payload;
      // update the other cards in the stack
      remainingCards.map((card, index) =>
        thunkAPI.dispatch(
          cardUpdated({
            ...card,
            captured: updated.cards.length < 2 ? undefined : card.captured,
            zIndex: updated.cards.length < 2 ? 1 : index,
            left: updated.cards.length < 2 ? updated.left + card.left + 25 : 10 * index + 10,
            top: updated.cards.length < 2 ? updated.top + card.top + 25 : 10 * index + 50
          })
        )
      );
      if (updated.cards.length < 2) thunkAPI.dispatch(stackRemoved(updated.id));
    }
  }
);
