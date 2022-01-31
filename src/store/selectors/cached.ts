import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { relative } from 'path';
import { cachedAdapter } from '../slices/cached';
import { RootState } from '../store';

export const selectors = cachedAdapter.getSelectors<RootState>(state => state.cached);

const selectByFilepath = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, filepath: PathLike) => filepath,
    (cached, filepath) => cached.filter(c => relative(c.path.toString(), filepath.toString()).length === 0)
);

const selectByFilepaths = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, filepaths: PathLike[]) => filepaths,
    (cached, filepaths) => cached.filter(c => filepaths.find(f => relative(c.path.toString(), f.toString()).length === 0))
);

const cachedSelectors = { ...selectors, selectByFilepath, selectByFilepaths };

export default cachedSelectors;