import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppThunkAPI } from '../store/store';
import { loadCard } from './handlers';
import { getMetafile } from './metafiles';

export const loadBranchVersions = createAsyncThunk<void, void, AppThunkAPI>(
  'cards/loadBranchVersion',
  async (_, thunkAPI) => {
    thunkAPI.dispatch(getMetafile({ virtual: { name: 'Version Tracker', handler: 'Tracker' } }))
      .unwrap()
      .then(metafile => thunkAPI.dispatch(loadCard({ metafile: metafile })));
  }
)