import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import type { Metafile, UUID } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateMatchesInMap, updateObject } from '../immutables';
import { removeRepo } from './repos';

export interface MetafilesState {
    [id: string]: Metafile
}

const initialState: MetafilesState = {}

export const metafilesSlice = createSlice({
    name: 'metafiles',
    initialState,
    reducers: {
        addMetafile: (state, action: PayloadAction<Metafile>) => addItemInMap(state, action.payload),
        removeMetafile: (state, action: PayloadAction<UUID>) => removeItemInMap(state, action.payload),
        updateMetafile: (state, action: PayloadAction<{ id: UUID, metafile: Partial<Metafile> }>) =>
            updateItemInMapById(state, action.payload.id, (metafile => updateObject<Metafile>(metafile, {
                ...action.payload.metafile, modified: DateTime.local().valueOf()
            })))
    },
    extraReducers: (builder) => {
        builder
            .addCase(removeRepo, (state, action) => {
                updateMatchesInMap(state, (metafile => metafile.repo === action.payload),
                    (metafile => updateObject<Metafile>(metafile, { ...metafile, repo: undefined })))
            })
    }
})

export const { addMetafile, removeMetafile, updateMetafile } = metafilesSlice.actions;

export default metafilesSlice.reducer;