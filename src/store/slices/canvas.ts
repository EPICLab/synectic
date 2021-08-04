import { createSlice } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import type { Timestamp, UUID } from '../../types';
import { addItemInArray, removeItemInArray } from '../immutables';
import { addCard, removeCard } from './cards';
import { addRepo, removeRepo } from './repos';
import { addStack, removeStack } from './stacks';

export interface CanvasState {
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
            .addCase(addRepo, (state, action) => { return { ...state, repos: addItemInArray<UUID>(state.repos, action.payload.id) } })
            .addCase(removeRepo, (state, action) => { return { ...state, repos: removeItemInArray(state.repos, action.payload) } })
            .addCase(addCard, (state, action) => { return { ...state, cards: addItemInArray<UUID>(state.cards, action.payload.id) } })
            .addCase(removeCard, (state, action) => { return { ...state, cards: removeItemInArray(state.cards, action.payload) } })
            .addCase(addStack, (state, action) => { return { ...state, stacks: addItemInArray<UUID>(state.stacks, action.payload.id) } })
            .addCase(removeStack, (state, action) => { return { ...state, stacks: removeItemInArray(state.stacks, action.payload) } })
    }
})

export default canvasSlice.reducer;