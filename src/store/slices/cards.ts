import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { PURGE } from 'redux-persist';
import { CardType, Timestamp, UUID } from '../types';

/** A card representation containing actionable content (e.g. editor, explorer, browser). */
export type Card = {
    /** The UUID for Card object. */
    readonly id: UUID;
    /** The name of card. */
    readonly name: string;
    /** The type of card. */
    readonly type: CardType;
    /** The UUID for related Metafile object. */
    readonly metafile: UUID;
    /** The timestamp when card was created. */
    readonly created: Timestamp;
    /** The timestamp for last update to card properties. */
    readonly modified: Timestamp;
    /** The UUID for capturing Stack object, or undefined if not captured. */
    readonly captured?: UUID | undefined;
    /** The stack order of card relative to overlapping elements. */
    readonly zIndex: number;
    /** The horizontal position of card relative to parent object. */
    readonly left: number;
    /** The vertical position of card relative to parent object. */
    readonly top: number;
    /** An array of CSS classes to apply on the containing div of the card. */
    readonly classes: string[];
};

export const cardsAdapter = createEntityAdapter<Card>();

export const cardsSlice = createSlice({
    name: 'cards',
    initialState: cardsAdapter.getInitialState(),
    reducers: {
        cardAdded: cardsAdapter.addOne,
        cardRemoved: cardsAdapter.removeOne,
        cardUpdated: (state, action: PayloadAction<Card>) => {
            cardsAdapter.upsertOne(state, {
                ...action.payload, modified: DateTime.local().valueOf()
            })
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                cardsAdapter.removeAll(state);
            })
    }
})

export const { cardAdded, cardRemoved, cardUpdated } = cardsSlice.actions;

export default cardsSlice.reducer;