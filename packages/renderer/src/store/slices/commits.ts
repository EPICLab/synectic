import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import type {Commit} from '@syn-types/commit';

export const commitAdapter = createEntityAdapter<Commit>({
  selectId: commit => commit.oid.toString(),
});

export const commitSlice = createSlice({
  name: 'commits',
  initialState: commitAdapter.getInitialState(),
  reducers: {
    commitAdded: commitAdapter.addOne,
    commitRemoved: commitAdapter.removeOne,
    commitUpdated: commitAdapter.upsertOne,
    commitReplaced: commitAdapter.setOne,
  },
});

export const {commitAdded, commitRemoved, commitUpdated, commitReplaced} = commitSlice.actions;

export default commitSlice.reducer;
