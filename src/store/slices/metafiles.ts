import { createAsyncThunk, createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import * as path from 'path';
import { PathLike } from 'fs-extra';
import type { Metafile, UUID } from '../../types';
import { repoRemoved } from './repos';
import { AppThunkAPI } from '../hooks';
import { filterObject } from '../../containers/format';

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
            .addCase(repoRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter((m): m is Metafile => m !== undefined)
                    .filter(m => m.repo === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['repo']) };
                    })
                metafilesSlice.actions.metafilesUpdated(updatedMetafiles);
            })
    }
})

export const getMetafileByFilepath = createAsyncThunk<Metafile | undefined, PathLike, AppThunkAPI>(
    'metafiles/getMetafileByFilepath',
    async (filepath, thunkAPI) => {
        return Object.values(thunkAPI.getState().metafiles.entities)
            .find(m => (m && m.path) && path.relative(m.path.toString(), filepath.toString()).length === 0);
    }
)

export const getMetafilesByRepo = createAsyncThunk<Metafile[], UUID, AppThunkAPI>(
    'metafiles/getMetafileByRepo',
    async (repoId, thunkAPI) => {
        return Object.values(thunkAPI.getState().metafiles.entities)
            .filter((metafile): metafile is Metafile => metafile != undefined)
            .filter(metafile => metafile.repo === repoId);
    }
)

export const getMetafileByBranch = createAsyncThunk<Metafile | undefined, { filepath: PathLike, branch: string }, AppThunkAPI>(
    'metafiles/getMetafileByBranch',
    async (param, thunkAPI) => {
        return Object.values(thunkAPI.getState().metafiles.entities)
            .find(m => m && (m.path === param.filepath && m.branch === param.branch));
    }
)

export const getMetafileByVirtual = createAsyncThunk<Metafile | undefined, { name: string, handler: string }, AppThunkAPI>(
    'metafiles/getMetafileByVirtual',
    async (param, thunkAPI) => {
        return Object.values(thunkAPI.getState().metafiles.entities)
            .find(m => m && (m.name === param.name && m.handler === param.handler));
    }
)

export const { metafileAdded, metafileRemoved, metafileUpdated } = metafilesSlice.actions;

export default metafilesSlice.reducer;