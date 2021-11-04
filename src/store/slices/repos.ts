import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { Repository } from '../../types';
import { PURGE } from 'redux-persist';
import { fetchNewRepo } from '../thunks/repos';

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
            .addCase(PURGE, (state) => {
                reposAdapter.removeAll(state);
            })
    }
});

export const { repoAdded, repoRemoved, repoUpdated } = reposSlice.actions;

export default reposSlice.reducer;

