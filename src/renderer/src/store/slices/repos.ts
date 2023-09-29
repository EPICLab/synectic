import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { Repository } from 'types/repo';

export const repoAdapter = createEntityAdapter<Repository>();
repoAdapter.addOne;

export const repoSlice = createSlice({
  name: 'repos',
  initialState: repoAdapter.getInitialState(),
  reducers: {
    repoAdded: repoAdapter.addOne,
    repoRemoved: repoAdapter.removeOne,
    repoUpdated: repoAdapter.upsertOne
  }
});

export const { repoAdded, repoRemoved, repoUpdated } = repoSlice.actions;

export default repoSlice.reducer;
