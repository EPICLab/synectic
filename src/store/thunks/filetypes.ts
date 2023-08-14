import { createAppAsyncThunk } from '../hooks';
import filetypeSelectors from '../selectors/filetypes';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { PathLike } from '../types';

export const fetchFiletype = createAppAsyncThunk<Filetype | undefined, PathLike>(
  'filetypes/fetchFiletype',
  async (filepath, thunkAPI) => {
    const state = thunkAPI.getState();
    const stats = await window.api.fs.extractStats(filepath);
    const result = stats?.isDir
      ? filetypeSelectors.selectByFiletype(state, 'Directory')
      : filetypeSelectors.selectByExtension(state, window.api.fs.extractExtension(filepath));
    return result.length > 0 ? result[0] : filetypeSelectors.selectByFiletype(state, 'Text')[0];
  }
);

export const importFiletypes = createAppAsyncThunk<void, Omit<Filetype, 'id'>[]>(
  'filetypes/importFiletypes',
  async (filetypes, thunkAPI) => {
    filetypes.map(filetype => {
      thunkAPI.dispatch(filetypeAdded({ id: window.api.uuid(), ...filetype }));
    });
  }
);
