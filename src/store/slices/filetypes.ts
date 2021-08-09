import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { Filetype } from '../../types';

export const filetypesAdapter = createEntityAdapter<Filetype>();

export const filetypesSlice = createSlice({
    name: 'filetypes',
    initialState: filetypesAdapter.getInitialState(),
    reducers: {
        filetypeAdded: filetypesAdapter.addOne,
        filetypeRemoved: filetypesAdapter.removeOne,
        filetypeUpdated: filetypesAdapter.upsertOne
    }
})

export const { filetypeAdded, filetypeRemoved, filetypeUpdated } = filetypesSlice.actions;

export default filetypesSlice.reducer;