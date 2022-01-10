import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import type { Branch } from '../../types';
import { fetchLocalBranch, fetchRemoteBranch } from '../thunks/branches';

export const branchesAdapter = createEntityAdapter<Branch>();

export const branchesSlice = createSlice({
    name: 'branches',
    initialState: branchesAdapter.getInitialState(),
    reducers: {
        branchAdded: branchesAdapter.addOne,
        branchRemoved: branchesAdapter.removeOne,
        branchUpdated: branchesAdapter.upsertOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLocalBranch.fulfilled, (state, action) => {
                if (action.payload !== undefined) branchesAdapter.addOne(state, action.payload);
            })
            .addCase(fetchRemoteBranch.fulfilled, (state, action) => {
                if (action.payload !== undefined) branchesAdapter.addOne(state, action.payload);
            })
            .addCase(PURGE, (state) => {
                branchesAdapter.removeAll(state);
            })
    }
});

export const { branchAdded, branchRemoved, branchUpdated } = branchesSlice.actions;

export default branchesSlice.reducer;