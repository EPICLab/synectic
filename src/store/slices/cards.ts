import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Card, UUID } from '../../types';
import { addItemInMap, removeItemInMap, updateItemInMapById, updateObject } from '../immutables';

export interface CardsState {
    [id: string]: Card
}

const initialState: CardsState = {}

export const cardsSlice = createSlice({
    name: 'cards',
    initialState,
    reducers: {
        addCard: (state, action: PayloadAction<Card>) => addItemInMap(state, action.payload),
        removeCard: (state, action: PayloadAction<UUID>) => removeItemInMap(state, action.payload),
        updateCard: (state, action: PayloadAction<{id: UUID, card: Partial<Card>}>) => 
            updateItemInMapById(state, action.payload.id, (card => updateObject<Card>(card, action.payload.card)))
    }
})

export const { addCard, removeCard, updateCard } = cardsSlice.actions;

export default cardsSlice.reducer;