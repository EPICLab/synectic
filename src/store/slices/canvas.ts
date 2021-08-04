import { createSlice } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import type { Timestamp, UUID } from '../../types';
import { addItemInArray, removeItemInArray } from '../immutables';
import { addCard, removeCard } from './cards';
import { addRepo, removeRepo } from './repos';
import { addStack, removeStack } from './stacks';

interface CanvasState {
    id: string,
    created: Timestamp,
    repos: UUID[],
    cards: UUID[],
    stacks: UUID[]
}

const initialState: CanvasState = {
    id: v4(),
    created: DateTime.local().valueOf(),
    repos: [],
    cards: [],
    stacks: []
}

export const canvasSlice = createSlice({
    name: 'canvas',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addRepo, (state, action) => { addItemInArray<UUID>(state.repos, action.payload.id) })
            .addCase(removeRepo, (state, action) => { removeItemInArray(state.repos, action.payload) })
            .addCase(addCard, (state, action) => { addItemInArray<UUID>(state.cards, action.payload.id) })
            .addCase(removeCard, (state, action) => { removeItemInArray(state.cards, action.payload) })
            .addCase(addStack, (state, action) => { addItemInArray<UUID>(state.stacks, action.payload.id) })
            .addCase(removeStack, (state, action) => { removeItemInArray(state.stacks, action.payload) })
    }
})

export default canvasSlice.reducer;