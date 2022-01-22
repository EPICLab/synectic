import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import type { Cached } from '../../types';

export const cachedAdapter = createEntityAdapter<Cached>();

export const cachedSlice = createSlice({
    name: 'cached',
    initialState: cachedAdapter.getInitialState(),
    reducers: {
        cachedAdded: cachedAdapter.addOne,
        cachedRemoved: cachedAdapter.removeOne,
        cachedSubscribed: (state, action: PayloadAction<Cached>) => {
            const existing = state.entities[action.payload.id];
            cachedAdapter.upsertOne(state, {
                ...action.payload, reserves: existing ? existing.reserves + 1 : 1
            })
        },
        cachedUnsubscribed: (state, action: PayloadAction<Cached>) => {
            const existing = state.entities[action.payload.id];
            if (existing) cachedAdapter.updateOne(state, {
                id: action.payload.id,
                changes: { reserves: existing.reserves - 1 }
            })
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                cachedAdapter.removeAll(state);
            })
    }
});

export const { cachedAdded, cachedRemoved, cachedSubscribed, cachedUnsubscribed } = cachedSlice.actions;

export default cachedSlice.reducer;