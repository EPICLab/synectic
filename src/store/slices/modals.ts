import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import { ModalType, UUID } from '../types';

/** A queued modal event (dialog or error) that requires a visible response from the system. */
export type Modal = {
    /** The UUID for Modal object. */
    readonly id: UUID;
    /** The type of modal (e.g. `NewCardDialog` or `Error`). */
    readonly type: ModalType;
    /** A specific type to delineate a class of modals (e.g. `LoadError`) */
    readonly subtype?: string;
    /** The UUID for related object that triggered the modal event. */
    readonly target?: UUID;
    /** Options targeting specific types of modals. */
    readonly options?: { [key: string]: string | number | boolean }
}

export const modalsAdapter = createEntityAdapter<Modal>();

export const modalsSlice = createSlice({
    name: 'modals',
    initialState: modalsAdapter.getInitialState(),
    reducers: {
        modalAdded: modalsAdapter.addOne,
        modalRemoved: modalsAdapter.removeOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                modalsAdapter.removeAll(state);
            })
    }
})

export const { modalAdded, modalRemoved } = modalsSlice.actions;

export default modalsSlice.reducer;