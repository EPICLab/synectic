import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Filetype, UUID } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export interface FiletypesState {
    [id: string]: Filetype
}

const initialState: FiletypesState = {}

export const filetypesSlice = createSlice({
    name: 'filetypes',
    initialState,
    reducers: {
        addFiletype: (state, action: PayloadAction<Filetype>) => addItemInMap(state, action.payload),
        removeFiletype: (state, action: PayloadAction<UUID>) => removeItemInMap(state, action.payload),
        updateFiletype: (state, action: PayloadAction<{id: UUID, filetype: Partial<Filetype>}>) => 
            updateItemInMapById(state, action.payload.id, (filetype => updateObject(filetype, action.payload.filetype)))
    }
})

export const { addFiletype, removeFiletype, updateFiletype } = filetypesSlice.actions;

export default filetypesSlice.reducer;