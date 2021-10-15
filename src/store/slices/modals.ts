import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import type { Modal } from '../../types';

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