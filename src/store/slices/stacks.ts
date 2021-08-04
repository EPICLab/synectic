import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Stack, UUID } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export interface StacksState {
    [id: string]: Stack
}

const initialState: StacksState = {}

export const stacksSlice = createSlice({
    name: 'stacks',
    initialState,
    reducers: {
        addStack: (state, action: PayloadAction<Stack>) => addItemInMap(state, action.payload),
        removeStack: (state, action: PayloadAction<UUID>) => removeItemInMap(state, action.payload),
        updateStack: (state, action: PayloadAction<{id: UUID, stack: Partial<Stack>}>) =>
            updateItemInMapById(state, action.payload.id, (stack => updateObject<Stack>(stack, action.payload.stack)))
    }
})

export const { addStack, removeStack, updateStack } = stacksSlice.actions;



export default stacksSlice.reducer;