import {extractExtension, extractStats, uuid} from '#preload';
import type {PathLike} from '@syn-types/app';
import type {Filetype} from '@syn-types/filetype';
import {createAppAsyncThunk} from '../hooks';
import filetypeSelectors from '../selectors/filetypes';
import {filetypeAdded} from '../slices/filetypes';

export const fetchFiletype = createAppAsyncThunk<Filetype | undefined, PathLike>(
  'filetypes/fetchFiletype',
  async (filepath, thunkAPI) => {
    const state = thunkAPI.getState();
    const stats = await extractStats(filepath);
    const result = stats?.isDir
      ? filetypeSelectors.selectByFiletype(state, 'Directory')
      : filetypeSelectors.selectByExtension(state, extractExtension(filepath));
    return result.length > 0 ? result[0] : filetypeSelectors.selectByFiletype(state, 'Text')[0];
  },
);

export const importFiletypes = createAppAsyncThunk<void, Omit<Filetype, 'id'>[]>(
  'filetypes/importFiletypes',
  async (filetypes, thunkAPI) => {
    filetypes.map(filetype => {
      thunkAPI.dispatch(filetypeAdded({id: uuid(), ...filetype}));
    });
  },
);
