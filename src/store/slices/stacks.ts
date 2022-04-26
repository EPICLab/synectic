import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { PURGE } from 'redux-persist';
import { Timestamp, UUID } from '../types';

/** A stack representation containing cards grouped according to the user. */
export type Stack = {
    /** The UUID for Stack object. */
    readonly id: UUID;
    /** The name of stack. */
    readonly name: string;
    /** The timestamp when stack was created. */
    readonly created: Timestamp;
    /** The timestamp for last update to stack properties. */
    readonly modified: Timestamp;
    /** The notes displayed on the stack. */
    readonly note: string;
    /** An array with all Card object UUIDs contained in stack. */
    readonly cards: UUID[];
    /** The horizontal position of stack relative to parent object. */
    readonly left: number;
    /** The vertical position of stack relative to parent object. */
    readonly top: number;
}

export const stackAdapter = createEntityAdapter<Stack>();

export const stacksSlice = createSlice({
    name: 'stacks',
    initialState: stackAdapter.getInitialState(),
    reducers: {
        stackAdded: stackAdapter.addOne,
        stackRemoved: stackAdapter.removeOne,
        stackUpdated: (state, action: PayloadAction<Stack>) => {
            stackAdapter.upsertOne(state, {
                ...action.payload, modified: DateTime.local().valueOf()
            })
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                stackAdapter.removeAll(state);
            })
    }
})

export const { stackAdded, stackRemoved, stackUpdated } = stacksSlice.actions;

export default stacksSlice.reducer;