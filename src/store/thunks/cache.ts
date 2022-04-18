import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { readFileAsync } from '../../containers/io';
import { AppThunkAPI } from '../hooks';
import cacheSelectors from '../selectors/cache';
import { Cache, cacheAdded } from '../slices/cache';

export const fetchCache = createAsyncThunk<Cache, PathLike, AppThunkAPI>(
    'cache/fetchOne',
    async (filepath, thunkAPI) => {
        const existing = cacheSelectors.selectById(thunkAPI.getState(), filepath.toString());
        return thunkAPI.dispatch(cacheAdded({
            path: filepath.toString(),
            reserve: existing ? existing.reserve + 1 : 1,
            content: await readFileAsync(filepath, { encoding: 'utf-8' })
        })).payload;
    }
);
