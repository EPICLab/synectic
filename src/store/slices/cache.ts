import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import { UUID } from '../types';
// import { fetchCache } from '../thunks/cache';

/** A reference to the cached file contents maintained by FSCache and holding a reserve count to determine when to invalidate and purge. */
export type Cache = {
    /** The absolute path to the cached file; also used as the unique ID. */
    readonly path: string;
    /** The list of Metafile UUIDs with an interest in this cache object. */
    readonly reserved: UUID[];
    /** The cached content associated with the underlying object content in the filesystem. */
    readonly content: string;
}

export const cacheAdapter = createEntityAdapter<Cache>({
    selectId: (cache) => cache.path,
    sortComparer: (a, b) => a.path.localeCompare(b.path)
});

export const cacheSlice = createSlice({
    name: 'cache',
    initialState: cacheAdapter.getInitialState(),
    reducers: {
        cacheAdded: cacheAdapter.upsertOne,
        cacheRemoved: cacheAdapter.removeOne,
        cacheUpdated: cacheAdapter.upsertOne,
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                cacheAdapter.removeAll(state);
            })
    }
});

export const { cacheAdded, cacheRemoved, cacheUpdated } = cacheSlice.actions;

export default cacheSlice.reducer;