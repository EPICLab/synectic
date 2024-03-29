import type {EntityState, PayloadAction} from '@reduxjs/toolkit';
import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import {DateTime} from 'luxon';
import type {Stack} from '@syn-types/stack';

export const stackAdapter = createEntityAdapter<Stack>();

export const stacksSlice = createSlice({
  name: 'stacks',
  initialState: stackAdapter.getInitialState(),
  reducers: {
    stackAdded: stackAdapter.addOne,
    stackRemoved: stackAdapter.removeOne,
    stackUpdated: (state: EntityState<Stack>, action: PayloadAction<Stack>) => {
      stackAdapter.upsertOne(state, {
        ...action.payload,
        modified: DateTime.local().valueOf(),
      });
    },
  },
});

export const {stackAdded, stackRemoved, stackUpdated} = stacksSlice.actions;

export default stacksSlice.reducer;
