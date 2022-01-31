import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import type { Card } from '../../types';
import { PURGE } from 'redux-persist';

export const cardsAdapter = createEntityAdapter<Card>();

export const cardsSlice = createSlice({
    name: 'cards',
    initialState: cardsAdapter.getInitialState(),
    reducers: {
        cardAdded: cardsAdapter.addOne,
        cardRemoved: cardsAdapter.removeOne,
        cardUpdated: (state, action: PayloadAction<Card>) => {
            cardsAdapter.upsertOne(state, {
                ...action.payload, modified: DateTime.local().valueOf()
            })
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                cardsAdapter.removeAll(state);
            })
    }
})

export const { cardAdded, cardRemoved, cardUpdated } = cardsSlice.actions;

export default cardsSlice.reducer;