import { createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { PURGE } from 'redux-persist';
import { Timestamp, UUID } from '../types';

/** A stack representation containing cards grouped according to the user. */
export type Stack = {
  /** The unique ID for Stack object. */
  readonly id: UUID;
  /** The name of stack. */
  readonly name: string;
  /** The timestamp when stack was created. */
  readonly created: Timestamp;
  /** The timestamp for last update to stack properties. */
  readonly modified: Timestamp;
  /** An array with all Card object unique IDs contained in stack. */
  readonly cards: UUID[];
  /** The horizontal position of stack relative to parent object. */
  readonly x: number;
  /** The vertical position of stack relative to parent object. */
  readonly y: number;
};

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
        modified: DateTime.local().valueOf()
      });
    }
  },
  extraReducers: builder => {
    builder.addCase(PURGE, state => {
      stackAdapter.removeAll(state);
    });
  }
});

export const { stackAdded, stackRemoved, stackUpdated } = stacksSlice.actions;

export default stacksSlice.reducer;
