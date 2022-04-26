import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { readFileAsync } from '../../containers/io';
import { AppThunkAPI } from '../hooks';
import cacheSelectors from '../selectors/cache';
import { Cache, cacheRemoved, cacheUpdated } from '../slices/cache';
import { UUID } from '../types';

export const subscribe = createAsyncThunk<Cache, { path: PathLike, metafile: UUID }, AppThunkAPI>(
    'cache/subscribe',
    async ({ path, metafile }, thunkAPI) => {
        const existing = cacheSelectors.selectById(thunkAPI.getState(), path.toString());
        const reserved = existing ? existing.reserved.includes(metafile) ? existing.reserved : [...existing.reserved, metafile] : [metafile];

        return thunkAPI.dispatch(cacheUpdated({
            path: path.toString(),
            reserved: reserved,
            content: await readFileAsync(path, { encoding: 'utf-8' })
        })).payload;
    }
);

export const unsubscribe = createAsyncThunk<undefined, { path: PathLike, metafile: UUID }, AppThunkAPI>(
    'cache/unsubscribe',
    async ({ path, metafile }, thunkAPI) => {
        const existing = cacheSelectors.selectById(thunkAPI.getState(), path.toString());
        if (existing?.reserved.includes(metafile)) {
            const updated = thunkAPI.dispatch(cacheUpdated({
                ...existing,
                reserved: existing.reserved.filter(m => m != metafile)
            })).payload;
            if (updated.reserved.length === 0) thunkAPI.dispatch(cacheRemoved(existing.path));
        }
        return undefined;
    }
);
