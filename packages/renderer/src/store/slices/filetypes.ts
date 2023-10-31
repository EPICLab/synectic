import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import type {Filetype} from '@syn-types/filetype';

export const filetypeAdapter = createEntityAdapter<Filetype>();

export const filetypeSlice = createSlice({
  name: 'filetypes',
  initialState: filetypeAdapter.getInitialState(),
  reducers: {
    filetypeAdded: filetypeAdapter.addOne,
    filetypeRemoved: filetypeAdapter.removeOne,
    filetypeUpdated: filetypeAdapter.upsertOne,
  },
});

export const {filetypeAdded, filetypeRemoved, filetypeUpdated} = filetypeSlice.actions;

export default filetypeSlice.reducer;
