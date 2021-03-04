import { remote } from 'electron';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store/root';

import { loadCard } from './handlers';

type PickerType = 'openFile' | 'openDirectory';

export const filePickerDialog = (pickerType?: PickerType): ThunkAction<Promise<void>, RootState, undefined, Action> => {
  return async (dispatch) => {
    const isMac = process.platform === 'darwin';
    const properties: ('openFile' | 'openDirectory')[] = pickerType ? [pickerType] : (isMac ? ['openFile', 'openDirectory'] : ['openFile']);
    const paths = await remote.dialog.showOpenDialog({ properties: [...properties, 'multiSelections'] });
    if (!paths.canceled && paths.filePaths) paths.filePaths.map(async filePath => dispatch(loadCard({ filepath: filePath })));
  };
}