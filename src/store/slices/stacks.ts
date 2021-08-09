import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import type { Stack } from '../../types';

export const stacksAdapter = createEntityAdapter<Stack>();

export const stacksSlice = createSlice({
    name: 'stacks',
    initialState: stacksAdapter.getInitialState(),
    reducers: {
        stackAdded: stacksAdapter.addOne,
        stackRemoved: stacksAdapter.removeOne,
        stackUpdated: (state, action: PayloadAction<Stack>) => {
            stacksAdapter.upsertOne(state, {
                ...action.payload, modified: DateTime.local().valueOf()
            })
        }
    }
})

export const { stackAdded, stackRemoved, stackUpdated } = stacksSlice.actions;

export default stacksSlice.reducer;