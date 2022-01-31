import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { relative } from 'path';
import type { Cached } from '../../types';
import { removeUndefined } from '../../containers/format';
import { AppThunkAPI } from '../hooks';

export const fetchCachedByFilepath = createAsyncThunk<Cached[], PathLike, AppThunkAPI>(
    'cached/fetchByPath',
    async (cachedFilepath, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().cached.entities))
            .filter(cached => relative(cached.path.toString(), cachedFilepath.toString()).length === 0);
    }
);