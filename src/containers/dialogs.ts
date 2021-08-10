import { createAsyncThunk } from '@reduxjs/toolkit';
import { remote } from 'electron';
import { join } from 'path';
import type { Metafile } from '../types';
import { AppThunkAPI } from '../store/hooks';
import { metafileUpdated } from '../store/slices/metafiles';
import { loadCard } from './handlers';
import { writeFileAsync } from './io';
import { updateGitInfo } from './metafiles';

type PickerType = 'openFile' | 'openDirectory';

export const fileOpenDialog = createAsyncThunk<void, PickerType | undefined, AppThunkAPI>(
  'dialogs/fileOpenDialog',
  async (pickerType, thunkAPI) => {
    const isMac = process.platform === 'darwin';
    const properties: ('openFile' | 'openDirectory')[] = pickerType ? [pickerType] : (isMac ? ['openFile', 'openDirectory'] : ['openFile']);
    const paths = await remote.dialog.showOpenDialog({ properties: [...properties, 'multiSelections'] });
    if (!paths.canceled && paths.filePaths) paths.filePaths.map(async filePath => thunkAPI.dispatch(loadCard({ filepath: filePath })));
  }
);

export const fileSaveDialog = createAsyncThunk<void, Metafile, AppThunkAPI>(
  'dialogs/fileSaveDialog',
  async (metafile, thunkAPI) => {
    const isMac = process.platform === 'darwin';
    const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac ? ['showHiddenFiles', 'createDirectory'] : ['showHiddenFiles'];

    const response = await remote.dialog.showSaveDialog({ defaultPath: join(process.cwd(), metafile.name), properties: properties });
    if (!response.canceled && response.filePath && metafile.content) {
      // update metafile
      thunkAPI.dispatch(metafileUpdated({ ...metafile, path: response.filePath, state: 'unmodified' }));
      // write file
      await writeFileAsync(response.filePath, metafile.content);
      // update git info
      Object.values(thunkAPI.getState().metafiles)
        .filter(m => m.path?.toString() === response.filePath)
        .map(m => thunkAPI.dispatch(updateGitInfo(m.id)));
    }
  }
);