import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import type { Metafile } from '../../types';
import { repoRemoved } from './repos';
import { filterObject } from '../../containers/format';
import { PURGE } from 'redux-persist';
import { fetchNewMetafile } from '../thunks/metafiles';
import { branchRemoved } from './branches';

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
            .addCase(fetchNewMetafile.fulfilled, (state, action) => {
                metafilesAdapter.addOne(state, action.payload);
            })
            .addCase(repoRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter((m): m is Metafile => m !== undefined)
                    .filter(m => m.repo === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['repo', 'branch', 'status']) };
                    })
                metafilesAdapter.updateMany(state, updatedMetafiles);
            })
            .addCase(branchRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter((m): m is Metafile => m !== undefined)
                    .filter(m => m.branch === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['branch', 'status']) }
                    })
                metafilesAdapter.updateMany(state, updatedMetafiles);
            })
            .addCase(PURGE, (state) => {
                metafilesAdapter.removeAll(state);
            })
    }
})

export const { metafileAdded, metafileRemoved, metafileUpdated, metafilesUpdated } = metafilesSlice.actions;

export default metafilesSlice.reducer;