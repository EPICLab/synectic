import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { RootState } from '../store/root';
import { loadCard } from './handlers';
import { getMetafile } from './metafiles';

export const loadBranchVersions = (): ThunkAction<Promise<void>, RootState, undefined, Action> => {
  return async (dispatch) => {
    const metafile = await dispatch(getMetafile({ virtual: { name: 'Version Tracker', handler: 'Tracker' } }));
    if (metafile) dispatch(loadCard({ metafile: metafile }));
  };
}