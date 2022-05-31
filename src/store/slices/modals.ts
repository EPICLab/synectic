import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import { ModalType, UUID } from '../types';

/** A queued modal event (dialog or error) that requires a visible response from the system. */
export type Modal = {
    /** The UUID for Modal object. */
    readonly id: UUID;
    /** The type of modal (e.g. `NewCardDialog` or `Error`). */
    readonly type: ModalType;
    /** The UUID for related object that triggered the modal event. */
    readonly target?: UUID;
    /** Options targeting specific types of modals. */
    readonly options?: { [key: string]: string | number | boolean }
}

export const modalAdapter = createEntityAdapter<Modal>();

export const modalSlice = createSlice({
    name: 'modals',
    initialState: modalAdapter.getInitialState(),
    reducers: {
        modalAdded: modalAdapter.addOne,
        modalRemoved: modalAdapter.removeOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                modalAdapter.removeAll(state);
            })
    }
})

export const { modalAdded, modalRemoved } = modalSlice.actions;

export default modalSlice.reducer;