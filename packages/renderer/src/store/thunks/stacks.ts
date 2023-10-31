import {uuid} from '#preload';
import type {UUID} from '@syn-types/app';
import {DateTime} from 'luxon';
import {createAppAsyncThunk} from '../hooks';
import cardSelectors from '../selectors/cards';
import stackSelectors from '../selectors/stacks';
import {cardUpdated} from '../slices/cards';
import {stackAdded, stackRemoved, stackUpdated} from '../slices/stacks';

/**
 * Create a new Stack component that is added to the Redux store and the UI.
 * @param name The name of the new Stack component.
 * @param cards The UUIDs of Card components that should be pushed onto the Stack component.
 * @param x The horizontal position of the new Stack component; defaults to 40.
 * @param y The vertical position of the new Stack component; defaults to 40.
 * @returns {UUID} The UUID of the new Stack component.
 */
export const createStack = createAppAsyncThunk<
  UUID,
  {name: string; cards: UUID[]; x?: number; y?: number}
>('stacks/createStack', async (input, thunkAPI) => {
  const cards = cardSelectors.selectByIds(thunkAPI.getState(), input.cards);

  const stackId = uuid();
  thunkAPI.dispatch(
    stackAdded({
      id: stackId,
      name: input.name,
      created: DateTime.local().valueOf(),
      modified: DateTime.local().valueOf(),
      cards: input.cards,
      x: input.x ?? 40,
      y: input.y ?? 40,
    }),
  );
  cards.map(card =>
    thunkAPI.dispatch(
      cardUpdated({
        ...card,
        captured: stackId,
      }),
    ),
  );
  return stackId;
});

/**
 * Remove a Stack component from the Redux store and the UI.
 * @param stack The UUID of the Stack component to remove.
 */
export const removeStack = createAppAsyncThunk<void, {stack: UUID}>(
  'stacks/removeStack',
  async (input, thunkAPI) => {
    const state = thunkAPI.getState();
    const stack = stackSelectors.selectById(state, input.stack);

    if (stack) {
      const cards = cardSelectors.selectByIds(state, stack.cards);
      cards.map((card, index) =>
        thunkAPI.dispatch(
          cardUpdated({
            ...card,
            captured: undefined,
            x: stack.x + index * 15,
            y: stack.y + (index + 1) * 15,
          }),
        ),
      );
      thunkAPI.dispatch(stackRemoved(stack.id));
    }
  },
);

/**
 * Push Card components onto the Stack by updating the Redux store and UI.
 * @param stack The UUID of the Stack component to receive the cards.
 * @param cards The UUIDs of Card components that should be pushed onto the Stack component.
 */
export const pushCards = createAppAsyncThunk<void, {stack: UUID; cards: UUID[]}>(
  'stacks/pushCards',
  async (input, thunkAPI) => {
    const state = thunkAPI.getState();
    const stack = stackSelectors.selectById(state, input.stack);
    const cards = cardSelectors.selectByIds(state, input.cards);

    if (stack && cards.length > 0) {
      thunkAPI.dispatch(
        stackUpdated({
          ...stack,
          cards: [...stack.cards, ...input.cards],
        }),
      );
      cards.map(card =>
        thunkAPI.dispatch(
          cardUpdated({
            ...card,
            captured: stack.id,
          }),
        ),
      );
    }
  },
);

/**
 * Pop Card components off of the Stack by updating the Redux store and UI.
 * @param stack The UUID of the Stack component to pop the cards from.
 * @param card The UUID of the Card component to be popped from the Stack component.
 * @param x The updated horizontal position of the popped Card component.
 * @param y The vertical position of the popped Card component.
 */
export const popCard = createAppAsyncThunk<void, {stack: UUID; card: UUID; x: number; y: number}>(
  'stacks/popCard',
  async (input, thunkAPI) => {
    const state = thunkAPI.getState();
    const stack = stackSelectors.selectById(state, input.stack);
    const card = cardSelectors.selectById(state, input.card);

    if (stack && card) {
      if (stack.cards.length <= 2) {
        thunkAPI.dispatch(removeStack({stack: stack.id}));
      } else {
        thunkAPI.dispatch(
          stackUpdated({
            ...stack,
            cards: stack.cards.filter(id => id !== input.card),
          }),
        );
      }
      thunkAPI.dispatch(
        cardUpdated({
          ...card,
          captured: undefined,
          x: input.x,
          y: input.y,
        }),
      );
    }
  },
);
