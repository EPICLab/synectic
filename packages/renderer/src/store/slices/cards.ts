import type {EntityState, PayloadAction} from '@reduxjs/toolkit';
import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import type {Card} from '@syn-types/card';
import {DateTime} from 'luxon';

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
        return {payload: {...card, modified: DateTime.local().valueOf()}};
      },
    },
  },
});

export const {cardAdded, cardRemoved, cardUpdated} = cardSlice.actions;

export default cardSlice.reducer;
