import { randomUUID } from 'crypto';
import { PathLike } from 'fs';
import { createAppAsyncThunk } from '../hooks';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { extractExtension, extractStats } from '../../containers/io';
import filetypeSelectors from '../selectors/filetypes';

export const fetchFiletype = createAppAsyncThunk<Filetype | undefined, PathLike>(
  'filetypes/fetchFiletype',
  async (filepath, thunkAPI) => {
    const state = thunkAPI.getState();
    const stats = await extractStats(filepath);
    const result =
      stats && stats.isDirectory()
        ? filetypeSelectors.selectByFiletype(state, 'Directory')
        : filetypeSelectors.selectByExtension(state, extractExtension(filepath));
    return result.length > 0 ? result[0] : filetypeSelectors.selectByFiletype(state, 'Text')[0];
  }
);

export const importFiletypes = createAppAsyncThunk<void, Omit<Filetype, 'id'>[]>(
  'filetypes/importFiletypes',
  async (filetypes, thunkAPI) => {
    filetypes.map(filetype => {
      thunkAPI.dispatch(filetypeAdded({ id: randomUUID(), ...filetype }));
    });
  }
);
