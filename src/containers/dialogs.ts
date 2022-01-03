import { createAsyncThunk } from '@reduxjs/toolkit';
import { ipcRenderer } from 'electron';
import { join } from 'path';
import type { Metafile } from '../types';
import { AppThunkAPI } from '../store/hooks';
import { metafileUpdated } from '../store/slices/metafiles';
import { loadCard } from '../store/thunks/handlers';
import { writeFileAsync } from './io';
import { removeUndefined } from './format';
import { fetchMetafile, fetchVersionControl, isFilebasedMetafile } from '../store/thunks/metafiles';
import { fetchRepo } from '../store/thunks/repos';

type PickerType = 'openFile' | 'openDirectory';

export const fileOpenDialog = createAsyncThunk<void, PickerType | void, AppThunkAPI>(
  'dialogs/fileOpenDialog',
  async (pickerType, thunkAPI) => {
    const isMac = process.platform === 'darwin';
    const properties: ('openFile' | 'openDirectory')[] = pickerType ? [pickerType] : (isMac ? ['openFile', 'openDirectory'] : ['openFile']);
    const paths: Electron.OpenDialogReturnValue = await ipcRenderer.invoke('fileOpenDialog', properties);
    if (!paths.canceled && paths.filePaths) {
      if (paths.filePaths.length > 1) {
        /** Multiple filepaths loading asynchronously can cause a race condition where all filepaths appear to require a new repo, which 
         * causes duplicated copies of the same repo to be added to the Redux store. Since multiple filepaths must all have the same root 
         * parent directory, and therefore share the same repo, we can fix it by resolving the repo of the first path before loading any 
         * other cards. */
        const metafile = await thunkAPI.dispatch(fetchMetafile({ filepath: paths.filePaths[0] })).unwrap();
        if (isFilebasedMetafile(metafile)) await thunkAPI.dispatch(fetchRepo(metafile));
      }
      await Promise.all(paths.filePaths.map(async filePath => await thunkAPI.dispatch(loadCard({ filepath: filePath }))));
    }
  }
);

export const fileSaveDialog = createAsyncThunk<void, Metafile, AppThunkAPI>(
  'dialogs/fileSaveDialog',
  async (metafile, thunkAPI) => {
    const isMac = process.platform === 'darwin';
    const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac ? ['showHiddenFiles', 'createDirectory'] : ['showHiddenFiles'];
    const response: Electron.SaveDialogReturnValue = await ipcRenderer.invoke('fileSaveDialog',
      { defaultPath: join(process.cwd(), metafile.name), properties: properties });
    if (!response.canceled && response.filePath && metafile.content) {
      // update metafile
      thunkAPI.dispatch(metafileUpdated({ ...metafile, path: response.filePath, state: 'unmodified' }));
      // write file
      await writeFileAsync(response.filePath, metafile.content);
      // update git info
      await Promise.all(
        removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
          .filter(m => m.path?.toString() === response.filePath)
          .filter(isFilebasedMetafile)
          .map(async m => {
            const vcs = await thunkAPI.dispatch(fetchVersionControl(m)).unwrap();
            thunkAPI.dispatch(metafileUpdated({ ...m, ...vcs }));
          })
      );
    }
  }
);

export const cloneDirectoryDialog = createAsyncThunk<string | null, string, AppThunkAPI>(
  'dialogs/cloneDirectoryDialog',
  async (repoName) => {
    const isMac = process.platform === 'darwin';
    const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac ? ['showHiddenFiles', 'createDirectory'] : ['showHiddenFiles'];
    const response: Electron.SaveDialogReturnValue = await ipcRenderer.invoke('fileSaveDialog',
      { defaultPath: join(process.cwd(), repoName), properties: properties, buttonLabel: 'Select Repo Location' });
    if (!response.canceled && response.filePath) {
      return response.filePath;
    }
    return null;
  }
);