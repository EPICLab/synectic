import { createAsyncThunk, createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';
import type { Metafile } from '../../types';
import { updateMatchesInMap, updateObject } from '../immutables';
import { removeRepo } from './repos';
import { AppThunkAPI } from '../store';

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
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(removeRepo, (state, action) => {
                updateMatchesInMap(state, (metafile => metafile.repo === action.payload),
                    (metafile => updateObject<Metafile>(metafile, { ...metafile, repo: undefined })))
            })
    }
})

export const getMetafileByFilepath = createAsyncThunk<Metafile | undefined, PathLike, AppThunkAPI>(
    'metafiles/getMetafileByFilepath',
    async (filepath, thunkAPI) => {
        return Object.values(thunkAPI.getState().metafiles.entities)
            .find(m => m && (m.path === filepath));
    }
)

export const { metafileAdded, metafileRemoved, metafileUpdated } = metafilesSlice.actions;

export default metafilesSlice.reducer;