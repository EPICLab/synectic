import { createSelector } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { RootState } from '../store';
import { isEqualPaths } from '../../containers/io';
import { cacheAdapter } from '../slices/cache';

const selectors = cacheAdapter.getSelectors<RootState>((state) => state.cache);

const selectByFilepaths = createSelector(
    selectors.selectAll,
    (_state: RootState, filepaths: PathLike[]) => filepaths,
    (cache, filepaths) => cache.filter(c => filepaths.find(f => isEqualPaths(c.path, f)))
);

const cacheSelectors = { ...selectors, selectByFilepaths };

export default cacheSelectors;