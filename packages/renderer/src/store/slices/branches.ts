import {isDefined} from '#preload';
import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import type {Branch, UnmergedBranch} from '@syn-types/branch';

export const branchAdapter = createEntityAdapter<Branch>();

export const branchSlice = createSlice({
  name: 'branches',
  initialState: branchAdapter.getInitialState(),
  reducers: {
    branchAdded: branchAdapter.addOne,
    branchRemoved: branchAdapter.removeOne,
    branchUpdated: branchAdapter.upsertOne,
    branchReplaced: branchAdapter.setOne,
  },
});

export const isUnmergedBranch = (branch: Branch | undefined): branch is UnmergedBranch => {
  return isDefined(branch) && (branch as UnmergedBranch).merging !== undefined;
};

export const {branchAdded, branchRemoved, branchReplaced, branchUpdated} = branchSlice.actions;

export default branchSlice.reducer;
