import {cwd, fileOpen, fileSave, join, platform} from '#preload';
import type {Metafile} from '@syn-types/metafile';
import type {OpenDialogOptions, SaveDialogOptions} from 'electron';
import {createAppAsyncThunk} from '/@/store/hooks';
import {isFileMetafile, isFilebasedMetafile, isVirtualMetafile} from '/@/store/slices/metafiles';
import {createCard} from '/@/store/thunks/cards';
import {saveFile} from '/@/store/thunks/metafiles';

export type SaveOption = SaveDialogOptions['properties'];

export const fileOpenDialog = createAppAsyncThunk<void, OpenDialogOptions | void>(
  'dialogs/fileOpenDialog',
  async (dialogOptions, thunkAPI) => {
    const properties: OpenDialogOptions['properties'] = dialogOptions?.['properties']
      ? dialogOptions['properties']
      : platform === 'darwin'
      ? ['openFile', 'openDirectory', 'multiSelections']
      : ['openFile', 'multiSelections'];
    const paths = await fileOpen({...dialogOptions, properties: properties});
    if (!paths.canceled && paths.filePaths) {
      await Promise.all(
        paths.filePaths.map(
          async filePath => await thunkAPI.dispatch(createCard({path: filePath})),
        ),
      );
    }
  },
);

export const fileSaveDialog = createAppAsyncThunk<boolean, Metafile>(
  'dialogs/fileSaveDialog',
  async (metafile, thunkAPI) => {
    const isMac = platform === 'darwin';
    const properties: SaveOption = isMac ? ['createDirectory'] : ['showHiddenFiles'];
    const defaultPath = isFilebasedMetafile(metafile) ? metafile.path : join(cwd(), metafile.name);
    const response = await fileSave({
      defaultPath,
      properties,
    });
    console.log(response);
    if (
      !response.canceled &&
      response.filePath &&
      (isFileMetafile(metafile) || isVirtualMetafile(metafile)) &&
      metafile.content
    ) {
      return await thunkAPI
        .dispatch(saveFile({id: metafile.id, filepath: response.filePath}))
        .unwrap();
    }
    return false;
  },
);

// export const cloneDirectoryDialog = createAppAsyncThunk<string | null, string>(
//   'dialogs/cloneDirectoryDialog',
//   async repoName => {
//     const isMac = process.platform === 'darwin';
//     const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac
//       ? ['showHiddenFiles', 'createDirectory']
//       : ['showHiddenFiles'];
//     const response: Electron.SaveDialogReturnValue = await ipcRenderer.invoke('fileSaveDialog', {
//       defaultPath: join(process.cwd(), repoName),
//       properties: properties,
//       buttonLabel: 'Select Repo Location'
//     });
//     if (!response.canceled && response.filePath) {
//       return response.filePath;
//     }
//     return null;
//   }
// );
