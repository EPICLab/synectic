import { createAsyncThunk } from '@reduxjs/toolkit';
import { ipcRenderer } from 'electron';
import { join } from 'path';
import { AppThunkAPI } from '../store/hooks';
import { isFilebasedMetafile, Metafile, metafileUpdated } from '../store/slices/metafiles';
import { createCard } from '../store/thunks/cards';
import { writeFileAsync } from './io';
import { updatedVersionedMetafile } from '../store/thunks/metafiles';
import { fetchRepo } from '../store/thunks/repos';
import metafileSelectors from '../store/selectors/metafiles';

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
         * causes duplicated copies of the same repo to be added to the Redux store. Since selecting multiple files in the dialog results
         * in filepaths that all have the same root parent directory, and therefore share the same repo, we can fix it by resolving the 
         * repo of the first path before loading any other cards. */
        await thunkAPI.dispatch(fetchRepo({ filepath: paths.filePaths[0] }));
      }
      await Promise.all(paths.filePaths.map(async filePath => await thunkAPI.dispatch(createCard({ path: filePath }))));
    }
  }
);

export const fileSaveDialog = createAsyncThunk<boolean, Metafile, AppThunkAPI>(
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
        metafileSelectors.selectByFilepath(thunkAPI.getState(), response.filePath)
          .filter(isFilebasedMetafile)
          .map(async m => await thunkAPI.dispatch(updatedVersionedMetafile(m)))
      );
      return true;
    }
    return false;
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