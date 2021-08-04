import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Modal, UUID } from '../../types';
import { addItemInMap, removeItemInMap } from '../immutables';

export interface ModalsState {
    [id: string]: Modal
}

const initialState: ModalsState = {}

export const modalsSlice = createSlice({
    name: 'modals',
    initialState,
    reducers: {
        addModal: (state, action: PayloadAction<Modal>) => addItemInMap(state, action.payload),
        removeModal: (state, action: PayloadAction<UUID>) => removeItemInMap(state, action.payload)
    }
})

export const { addModal, removeModal } = modalsSlice.actions;

export default modalsSlice.reducer;