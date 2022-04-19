import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { CardType, UUID } from '../types';

/** A supported filetype with mapping to type of supporting card in Synectic. */
export type Filetype = {
    /** The UUID for Filetype object. */
    readonly id: UUID;
    /** The filetype format for encoding/decoding. */
    readonly filetype: string;
    /** The type of card that can load content for this filetype. */
    readonly handler: CardType;
    /** An array with all filetype extensions (e.g. `.py`, `.js`, `.gitignore`) associated with this filetype. */
    readonly extensions: string[];
}

export const filetypeAdapter = createEntityAdapter<Filetype>();

export const filetypeSlice = createSlice({
    name: 'filetypes',
    initialState: filetypeAdapter.getInitialState(),
    reducers: {
        filetypeAdded: filetypeAdapter.addOne,
        filetypeRemoved: filetypeAdapter.removeOne,
        filetypeUpdated: filetypeAdapter.upsertOne
    }
})

export const { filetypeAdded, filetypeRemoved, filetypeUpdated } = filetypeSlice.actions;

export default filetypeSlice.reducer;