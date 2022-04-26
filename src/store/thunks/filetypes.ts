import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 } from 'uuid';
import { PathLike } from 'fs';
import { AppThunkAPI } from '../hooks';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { extractExtension, extractStats } from '../../containers/io';
import filetypeSelectors from '../selectors/filetypes';

export const fetchFiletype = createAsyncThunk<Filetype | undefined, PathLike, AppThunkAPI>(
    'filetypes/fetchFiletype',
    async (filepath, thunkAPI) => {
        const state = thunkAPI.getState();
        const stats = await extractStats(filepath);
        const result = (stats && stats.isDirectory()) ?
            filetypeSelectors.selectByFiletype(state, 'Directory') :
            filetypeSelectors.selectByExtension(state, extractExtension(filepath));
        return result.length > 0 ? result[0] : filetypeSelectors.selectByFiletype(state, 'Text')[0];
    }
);

export const importFiletypes = createAsyncThunk<void, Omit<Filetype, 'id'>[], AppThunkAPI>(
    'filetypes/importFiletypes',
    async (filetypes, thunkAPI) => {
        filetypes.map(filetype => {
            thunkAPI.dispatch(filetypeAdded({ id: v4(), ...filetype }));
        });
    }
)

