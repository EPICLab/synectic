import { createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { PURGE } from 'redux-persist';
import { CardType, Timestamp, UUID } from '../types';

/** A card representation containing actionable content (e.g. editor, explorer, browser). */
export type Card = {
  /** The UUID for Card object. */
  readonly id: UUID;
  /** The name of card. */
  readonly name: string;
  /** The type of card. */
  readonly type: CardType;
  /** The UUID for related Metafile object. */
  readonly metafile: UUID;
  /** The timestamp when card was created. */
  readonly created: Timestamp;
  /** The timestamp for last update to card properties. */
  readonly modified: Timestamp;
  /** The UUID for capturing Stack object, or undefined if not captured. */
  readonly captured: UUID | undefined;
  /** Indicator for whether the card is expanded to fullscreen mode. */
  readonly expanded: boolean;
  /** Indicator for whether the card is flipped to the reverse side. */
  readonly flipped: boolean;
  /** The horizontal position of card relative to parent object. */
  readonly x: number;
  /** The vertical position of card relative to parent object. */
  readonly y: number;
};

export const cardAdapter = createEntityAdapter<Card>();

export const cardSlice = createSlice({
  name: 'cards',
  initialState: cardAdapter.getInitialState(),
  reducers: {
    cardAdded: cardAdapter.addOne,
    cardRemoved: cardAdapter.removeOne,
    cardUpdated: {
      reducer: (state: EntityState<Card>, action: PayloadAction<Card>) => {
        cardAdapter.upsertOne(state, action.payload);
      },
      prepare: (card: Card) => {
        return { payload: { ...card, modified: DateTime.local().valueOf() } };
      }
    }
  },
  extraReducers: builder => {
    builder.addCase(PURGE, state => {
      cardAdapter.removeAll(state);
    });
  }
});

export const { cardAdded, cardRemoved, cardUpdated } = cardSlice.actions;

export default cardSlice.reducer;
