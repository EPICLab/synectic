import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppThunkAPI } from '../store/hooks';
import { loadCard } from './handlers';
import { getMetafile } from './metafiles';

export const loadBranchVersions = createAsyncThunk<void, void, AppThunkAPI>(
  'cards/loadBranchVersion',
  async (_, thunkAPI) => {
    thunkAPI.dispatch(getMetafile({ virtual: { name: 'Repos Tracker', handler: 'ReposTracker' } }))
      .unwrap()
      .then(metafile => {
        if (metafile) thunkAPI.dispatch(loadCard({ metafile: metafile }));
      });
  }
)