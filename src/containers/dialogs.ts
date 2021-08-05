import { remote } from 'electron';
import { join } from 'path';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { ActionKeys } from '../store/actions';
import { RootState } from '../store/root';

import type { Metafile } from '../types';
import { loadCard } from './handlers';
import { writeFileAsync } from './io';
import { updateGitInfo } from './metafiles';

type PickerType = 'openFile' | 'openDirectory';

export const fileOpenDialog = (pickerType?: PickerType): ThunkAction<Promise<void>, RootState, undefined, Action> => {
  return async (dispatch) => {
    const isMac = process.platform === 'darwin';
    const properties: ('openFile' | 'openDirectory')[] = pickerType ? [pickerType] : (isMac ? ['openFile', 'openDirectory'] : ['openFile']);
    const paths = await remote.dialog.showOpenDialog({ properties: [...properties, 'multiSelections'] });
    if (!paths.canceled && paths.filePaths) paths.filePaths.map(async filePath => dispatch(loadCard({ filepath: filePath })));
  };
}

export const fileSaveDialog = (metafile: Metafile): ThunkAction<Promise<void>, RootState, undefined, Action> => {
  return async (dispatch, getState) => {
    const isMac = process.platform === 'darwin';
    const properties: ('showHiddenFiles' | 'createDirectory')[] = isMac ? ['showHiddenFiles', 'createDirectory'] : ['showHiddenFiles'];

    const response = await remote.dialog.showSaveDialog({ defaultPath: join(process.cwd(), metafile.name), properties: properties });
    if (!response.canceled && response.filePath && metafile.content) {
      // update metafile
      dispatch({
        type: ActionKeys.UPDATE_METAFILE,
        id: metafile.id,
        metafile: { ...metafile, path: response.filePath, state: 'unmodified' }
      });
      // write file
      await writeFileAsync(response.filePath, metafile.content);
      // update git info
      Object.values(getState().metafiles)
        .filter(m => m.path?.toString() === response.filePath)
        .map(m => dispatch(updateGitInfo(m.id)));
    }
  }
}