import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import type { Repository } from '../../types';
import { fetchNewRepo } from '../thunks/repos';
import { branchRemoved } from './branches';

export const reposAdapter = createEntityAdapter<Repository>();

export const reposSlice = createSlice({
    name: 'repos',
    initialState: reposAdapter.getInitialState(),
    reducers: {
        repoAdded: reposAdapter.addOne,
        repoRemoved: reposAdapter.removeOne,
        repoUpdated: reposAdapter.upsertOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNewRepo.fulfilled, (state, action) => {
                reposAdapter.addOne(state, action.payload);
            })
            .addCase(branchRemoved, (state, action) => {
                const updatedRepos = Object.values(state.entities)
                    .filter((r): r is Repository => r !== undefined)
                    .filter(r => r.local.includes(action.payload.toString()))
                    .map(r => {
                        const updatedLocal = r.local.filter(branch => branch !== action.payload);
                        return { id: r.id, changes: { ...r, local: updatedLocal } }
                    })
                reposAdapter.updateMany(state, updatedRepos);

            })
            .addCase(PURGE, (state) => {
                reposAdapter.removeAll(state);
            })
    }
});

export const { repoAdded, repoRemoved, repoUpdated } = reposSlice.actions;

export default reposSlice.reducer;

