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

export const filetypesAdapter = createEntityAdapter<Filetype>();

export const filetypesSlice = createSlice({
    name: 'filetypes',
    initialState: filetypesAdapter.getInitialState(),
    reducers: {
        filetypeAdded: filetypesAdapter.addOne,
        filetypeRemoved: filetypesAdapter.removeOne,
        filetypeUpdated: filetypesAdapter.upsertOne
    }
})

export const { filetypeAdded, filetypeRemoved, filetypeUpdated } = filetypesSlice.actions;

export default filetypesSlice.reducer;