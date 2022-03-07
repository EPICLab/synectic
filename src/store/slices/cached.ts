import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { PURGE } from 'redux-persist';
import { UUID } from '../types';

/** A reference to the cached file contents maintained by FSCache and holding a reserve count to determine when to invalidate and purge. */
export type Cached = {
    /** The UUID for Cached object. */
    readonly id: UUID;
    /** The count of interested components currently active within Synectic; FSCache will invalidate and purge this object when the count reaches 0. */
    readonly reserves: number;
    /** The Metafile object UUID associated with the same filesystem object as the cached object. */
    readonly metafile: UUID;
    /** The relative or absolute path to the file associated with the cached object. */
    readonly path: PathLike;
}

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