import { RootState } from '../store';
import { createSelector } from '@reduxjs/toolkit';
import { filetypesAdapter } from '../slices/filetypes';
import { CardType } from '../types';

export const selectors = filetypesAdapter.getSelectors<RootState>(state => state.filetypes);

const selectByFiletype = createSelector(
    selectors.selectAll,
    (_state: RootState, filetype: string) => filetype,
    (filetypes, filetype) => filetypes.filter(f => f.filetype === filetype)
)

const selectByHandler = createSelector(
    selectors.selectAll,
    (_state: RootState, handler: CardType) => handler,
    (filetypes, handler) => filetypes.filter(f => f.handler === handler)
)

const selectByExtension = createSelector(
    selectors.selectAll,
    (_state: RootState, extension: string) => extension,
    (filetypes, extension) => filetypes.filter(f => f.extensions.some(ext => ext === extension))
)

const filetypeSelectors = { ...selectors, selectByFiletype, selectByHandler, selectByExtension };

export default filetypeSelectors;