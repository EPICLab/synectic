import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { Repository } from '../../types';
import { AppThunkAPI } from '../hooks';

export const reposAdapter = createEntityAdapter<Repository>();

export const reposSlice = createSlice({
    name: 'repos',
    initialState: reposAdapter.getInitialState(),
    reducers: {
        repoAdded: reposAdapter.addOne,
        repoRemoved: reposAdapter.removeOne,
        repoUpdated: reposAdapter.upsertOne
    }
});

export const getRepoByName = createAsyncThunk<Repository | undefined, { name: string, url?: string }, AppThunkAPI>(
    'repos/getRepoByName',
    async (param, thunkAPI) => {
        return param.url ? Object.values(thunkAPI.getState().repos.entities).find(r => r && r.name === param.name && r.url === param.url) :
            Object.values(thunkAPI.getState().repos.entities).find(r => r && r.name === param.name);
    }
)

export const { repoAdded, repoRemoved, repoUpdated } = reposSlice.actions;

export default reposSlice.reducer;