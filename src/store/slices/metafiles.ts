import { createAsyncThunk, createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import * as path from 'path';
import { PathLike } from 'fs-extra';
import type { Metafile, UUID } from '../../types';
import { repoRemoved } from './repos';
import { AppThunkAPI } from '../hooks';
import { filterObject, removeUndefined } from '../../containers/format';
import { PURGE } from 'redux-persist';
import { fetchNewMetafile } from '../thunks/metafiles';

export const metafilesAdapter = createEntityAdapter<Metafile>();

export const metafilesSlice = createSlice({
    name: 'metafiles',
    initialState: metafilesAdapter.getInitialState(),
    reducers: {
        metafileAdded: metafilesAdapter.addOne,
        metafileRemoved: metafilesAdapter.removeOne,
        metafileUpdated: (state, action: PayloadAction<Metafile>) => {
            metafilesAdapter.upsertOne(state, {
                ...action.payload, modified: DateTime.local().valueOf()
            })
        },
        metafilesUpdated: metafilesAdapter.updateMany
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNewMetafile.fulfilled, (_state, action) => {
                metafilesSlice.actions.metafileAdded(action.payload)
            })
            .addCase(repoRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter((m): m is Metafile => m !== undefined)
                    .filter(m => m.repo === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['repo']) };
                    })
                metafilesSlice.actions.metafilesUpdated(updatedMetafiles);
            })
            .addCase(PURGE, (state) => {
                metafilesAdapter.removeAll(state);
            })
    }
})

export const { metafileAdded, metafileRemoved, metafileUpdated, metafilesUpdated } = metafilesSlice.actions;

export default metafilesSlice.reducer;

export const fetchMetafileById = createAsyncThunk<Metafile | undefined, UUID, AppThunkAPI>(
    'metafiles/fetchById',
    async (id, thunkAPI) => {
        return thunkAPI.getState().metafiles.entities[id];
    }
);

export const fetchMetafilesByFilepath = createAsyncThunk<Metafile[], PathLike, AppThunkAPI>(
    'metafiles/fetchByPath',
    async (metafileFilepath, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(metafile => (metafile && metafile.path) &&
                path.relative(metafile.path.toString(), metafileFilepath.toString()).length === 0);
    }
)

export const fetchMetafilesByRepo = createAsyncThunk<Metafile[], UUID, AppThunkAPI>(
    'metafiles/fetchByRepo',
    async (repoId, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(metafile => metafile.repo === repoId);
    }
)

export const fetchMetafilesByBranch = createAsyncThunk<Metafile[], string, AppThunkAPI>(
    'metafiles/fetchByBranch',
    async (branch, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(metafile => metafile.branch === branch);
    }
)

export const fetchMetafilesByVirtual = createAsyncThunk<Metafile[], { name: string, handler: string }, AppThunkAPI>(
    'metafiles/fetchByVirtual',
    async (virtual, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(metafile => metafile.name === virtual.name && metafile.handler === virtual.handler);
    }
)