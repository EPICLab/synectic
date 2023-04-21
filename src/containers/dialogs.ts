import { ipcRenderer } from 'electron';
import { join } from 'path';
import { createAppAsyncThunk } from '../store/hooks';
import { isFilebasedMetafile, Metafile, metafileUpdated } from '../store/slices/metafiles';
import { buildCard } from '../store/thunks/cards';
import { writeFileAsync } from './io';
import { updateVersionedMetafile } from '../store/thunks/metafiles';
import metafileSelectors from '../store/selectors/metafiles';

type PickerType = 'openFile' | 'openDirectory';

export const fileOpenDialog = createAppAsyncThunk<void, PickerType | void>(
  'dialogs/fileOpenDialog',
  async (pickerType, thunkAPI) => {
    const isMac = process.platform === 'darwin';
    const properties: ('openFile' | 'openDirectory')[] = pickerType
      ? [pickerType]
      : isMac
      ? ['openFile', 'openDirectory']
      : ['openFile'];
    const paths: Electron.OpenDialogReturnValue = await ipcRenderer.invoke(
      'fileOpenDialog',
      properties
    );
    if (!paths.canceled && paths.filePaths) {
      await Promise.all(
        paths.filePaths.map(
          async filePath => await thunkAPI.dispatch(buildCard({ path: filePath }))
        )
      );
    }
  }
);

export const fileSaveDialog = createAppAsyncThunk<boolean, Metafile>(
  'dialogs/fileSaveDialog',
  async (metafile, thunkAPI) => {
    const isMac = process.platform === 'darwin';
    const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac
      ? ['showHiddenFiles', 'createDirectory']
      : ['showHiddenFiles'];
    const response: Electron.SaveDialogReturnValue = await ipcRenderer.invoke('fileSaveDialog', {
      defaultPath: join(process.cwd(), metafile.name),
      properties: properties
    });
    if (!response.canceled && response.filePath && metafile.content) {
      // update metafile
      thunkAPI.dispatch(
        metafileUpdated({ ...metafile, path: response.filePath, state: 'unmodified' })
      );
      // write file
      await writeFileAsync(response.filePath, metafile.content);
      // update git info
      await Promise.all(
        metafileSelectors
          .selectByFilepath(thunkAPI.getState(), response.filePath)
          .filter(isFilebasedMetafile)
          .map(async m => await thunkAPI.dispatch(updateVersionedMetafile(m)))
      );
      return true;
    }
    return false;
  }
);

export const cloneDirectoryDialog = createAppAsyncThunk<string | null, string>(
  'dialogs/cloneDirectoryDialog',
  async repoName => {
    const isMac = process.platform === 'darwin';
    const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac
      ? ['showHiddenFiles', 'createDirectory']
      : ['showHiddenFiles'];
    const response: Electron.SaveDialogReturnValue = await ipcRenderer.invoke('fileSaveDialog', {
      defaultPath: join(process.cwd(), repoName),
      properties: properties,
      buttonLabel: 'Select Repo Location'
    });
    if (!response.canceled && response.filePath) {
      return response.filePath;
    }
    return null;
  }
);
