import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Repository, UUID } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export interface ReposState {
    [id: string]: Repository
}

const initialState: ReposState = {}

export const reposSlice = createSlice({
    name: 'repos',
    initialState,
    reducers: {
        addRepo: (state, action: PayloadAction<Repository>) => addItemInMap(state, action.payload),
        removeRepo: (state, action: PayloadAction<UUID>) => removeItemInMap(state, action.payload),
        updateRepo: (state, action: PayloadAction<{id: UUID, repo: Partial<Repository>}>) =>
            updateItemInMapById(state, action.payload.id, (repo => updateObject<Repository>(repo, action.payload.repo)))
    }
})

export const { addRepo, removeRepo, updateRepo } = reposSlice.actions;

export default reposSlice.reducer;